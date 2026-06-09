import express from 'express'
import { register, login, oauthLogin } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/oauth2', oauthLogin)

export default router
