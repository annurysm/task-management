const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3002

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3002',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`)

    // Handle joining team rooms
    socket.on('joinTeam', (teamId) => {
      console.log(`Socket ${socket.id} joining team: ${teamId}`)
      socket.join(`team:${teamId}`)
      
      // Notify other team members
      socket.to(`team:${teamId}`).emit('userJoined', {
        userId: socket.data?.userId || 'unknown',
        userName: socket.data?.userName || 'Unknown User',
        teamId
      })
    })

    // Handle leaving team rooms
    socket.on('leaveTeam', (teamId) => {
      console.log(`Socket ${socket.id} leaving team: ${teamId}`)
      socket.leave(`team:${teamId}`)
      
      // Notify other team members
      socket.to(`team:${teamId}`).emit('userLeft', {
        userId: socket.data?.userId || 'unknown',
        teamId
      })
    })

    // Handle joining organization rooms
    socket.on('joinOrganization', (organizationId) => {
      console.log(`Socket ${socket.id} joining organization: ${organizationId}`)
      socket.join(`org:${organizationId}`)
    })

    // Handle leaving organization rooms
    socket.on('leaveOrganization', (organizationId) => {
      console.log(`Socket ${socket.id} leaving organization: ${organizationId}`)
      socket.leave(`org:${organizationId}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(`Socket ${socket.id} disconnected: ${reason}`)
    })
  })

  // Make io accessible globally
  global.io = io

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})