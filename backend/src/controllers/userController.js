export async function getProfile(req, res) {
  const { user } = req
  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.provider,
    team: user.team,
  })
}

export async function updateProfile(req, res) {
  const { user } = req
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ message: 'Name is required' })
  }

  user.name = name
  await user.save()

  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
