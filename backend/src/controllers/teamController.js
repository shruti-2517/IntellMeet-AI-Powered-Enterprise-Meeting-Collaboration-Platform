import crypto from 'crypto'
import Team from '../models/Team.js'
import User from '../models/User.js'

export async function createTeam(req, res) {
  const { name } = req.body
  if (!name) {
    return res.status(400).json({ message: 'Team name is required' })
  }

  const team = await Team.create({
    name,
    owner: req.user._id,
    members: [req.user._id],
  })

  req.user.team = team._id
  await req.user.save()

  res.status(201).json({ team })
}

export async function inviteTeamMember(req, res) {
  const { teamId } = req.params
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Invite email is required' })
  }

  const team = await Team.findById(teamId)
  if (!team) {
    return res.status(404).json({ message: 'Team not found' })
  }

  if (!team.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only team owners may send invitations' })
  }

  const existingInvite = team.invites.find((invite) => invite.email === email && invite.status === 'pending')
  if (existingInvite) {
    return res.status(409).json({ message: 'Invite already pending for this email' })
  }

  const token = crypto.randomBytes(20).toString('hex')
  team.invites.push({ email, invitedBy: req.user._id, token })
  await team.save()

  res.json({ message: 'Invitation sent', invite: { email, token } })
}

export async function acceptInvite(req, res) {
  const { token } = req.body
  if (!token) {
    return res.status(400).json({ message: 'Invite token is required' })
  }

  const team = await Team.findOne({ 'invites.token': token })
  if (!team) {
    return res.status(404).json({ message: 'Invalid invite token' })
  }

  const invite = team.invites.find((item) => item.token === token)
  if (!invite || invite.status !== 'pending') {
    return res.status(400).json({ message: 'Invite is not valid' })
  }

  invite.status = 'accepted'
  team.members.push(req.user._id)
  await team.save()

  req.user.team = team._id
  await req.user.save()

  res.json({ message: 'Invite accepted', team: { id: team._id, name: team.name } })
}

export async function getTeam(req, res) {
  const { teamId } = req.params
  const team = await Team.findById(teamId).populate('members', 'name email role')
  if (!team) {
    return res.status(404).json({ message: 'Team not found' })
  }

  if (!team.members.some((member) => member._id.equals(req.user._id))) {
    return res.status(403).json({ message: 'Access denied to this team' })
  }

  res.json({ team })
}
