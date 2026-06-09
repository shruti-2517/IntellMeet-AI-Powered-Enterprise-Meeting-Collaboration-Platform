import bcrypt from 'bcryptjs'
import axios from 'axios'
import User from '../models/User.js'
import { createToken } from '../utils/jwt.js'

const oauthProviders = {
  google: {
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  github: {
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    userInfoEndpoint: 'https://api.github.com/user',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
  },
}

function normalizeProviderResponse(provider, data) {
  if (provider === 'google') {
    return {
      email: data.email,
      name: data.name || data.given_name || data.email,
      providerId: data.id,
    }
  }

  if (provider === 'github') {
    return {
      email: data.email || data.login + '@github.local',
      name: data.name || data.login,
      providerId: String(data.id),
    }
  }

  return null
}

export async function register(req, res) {
  const { email, name, password, role } = req.body
  if (!email || !name || !password) {
    return res.status(400).json({ message: 'Email, name, and password are required' })
  }

  const existing = await User.exists({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await User.create({
    email,
    name,
    password: hashedPassword,
    role: role === 'Admin' ? 'Admin' : 'Member',
  })

  const token = createToken({ userId: user._id, role: user.role })
  res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
}

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await User.findOne({ email })
  if (!user || !user.password) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const matches = await bcrypt.compare(password, user.password)
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = createToken({ userId: user._id, role: user.role })
  res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
}

export async function oauthLogin(req, res) {
  const { provider, code } = req.body
  if (!provider || !code) {
    return res.status(400).json({ message: 'Provider and code are required' })
  }

  const config = oauthProviders[provider]
  if (!config) {
    return res.status(400).json({ message: 'Unsupported OAuth provider' })
  }

  try {
    const tokenResponse = await axios.post(
      config.tokenEndpoint,
      {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: provider === 'google' ? 'authorization_code' : undefined,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    const accessToken = tokenResponse.data.access_token || tokenResponse.data.accessToken
    if (!accessToken) {
      console.error('OAuth token exchange failed', { provider, response: tokenResponse.data })
      return res.status(500).json({ message: 'OAuth login failed' })
    }

    const userInfoResponse = await axios.get(config.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const normalized = normalizeProviderResponse(provider, userInfoResponse.data)
    if (!normalized) {
      console.error('OAuth normalization failed', { provider, data: userInfoResponse.data })
      return res.status(500).json({ message: 'OAuth login failed' })
    }

    let user = await User.findOne({ providerId: normalized.providerId, provider })
    if (!user) {
      user = await User.create({
        email: normalized.email,
        name: normalized.name,
        provider,
        providerId: normalized.providerId,
        role: 'Member',
      })
    }

    const token = createToken({ userId: user._id, role: user.role })
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('OAuth login error', error)
    res.status(500).json({ message: 'OAuth login failed' })
  }
}
