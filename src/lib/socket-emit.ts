declare global {
  var io: any
}

// Emit events to specific rooms
export function emitToTeam(teamId: string, event: string, data: any) {
  if (global.io) {
    global.io.to(`team:${teamId}`).emit(event, data)
  }
}

export function emitToOrganization(organizationId: string, event: string, data: any) {
  if (global.io) {
    global.io.to(`org:${organizationId}`).emit(event, data)
  }
}

export function emitToAll(event: string, data: any) {
  if (global.io) {
    global.io.emit(event, data)
  }
}

// Specific event emitters
export function emitTaskUpdate(teamId: string, organizationId: string, data: {
  id: string
  status: string
  updatedBy: string
}) {
  emitToTeam(teamId, 'taskUpdated', {
    ...data,
    teamId,
    organizationId
  })
  
  emitToOrganization(organizationId, 'taskUpdated', {
    ...data,
    teamId,
    organizationId
  })
}

export function emitTaskCreated(teamId: string, organizationId: string, data: {
  id: string
  task: any
  createdBy: string
}) {
  emitToTeam(teamId, 'taskCreated', {
    ...data,
    teamId,
    organizationId
  })
  
  emitToOrganization(organizationId, 'taskCreated', {
    ...data,
    teamId,
    organizationId
  })
}

export function emitTaskDeleted(teamId: string, organizationId: string, data: {
  id: string
  deletedBy: string
}) {
  emitToTeam(teamId, 'taskDeleted', {
    ...data,
    teamId,
    organizationId
  })
  
  emitToOrganization(organizationId, 'taskDeleted', {
    ...data,
    teamId,
    organizationId
  })
}

export function emitEpicUpdated(organizationId: string, data: {
  id: string
  teamId?: string
  updatedBy: string
}) {
  if (data.teamId) {
    emitToTeam(data.teamId, 'epicUpdated', {
      ...data,
      organizationId
    })
  }
  
  emitToOrganization(organizationId, 'epicUpdated', {
    ...data,
    organizationId
  })
}