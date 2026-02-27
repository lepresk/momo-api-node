export class MomoException extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'MomoException'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class BadRequestException extends MomoException {
  constructor(message: string = 'Bad request') {
    super(message, 400)
    this.name = 'BadRequestException'
  }
}

export class InvalidSubscriptionKeyException extends MomoException {
  constructor(message: string = 'Invalid subscription key') {
    super(message, 401)
    this.name = 'InvalidSubscriptionKeyException'
  }
}

export class ResourceNotFoundException extends MomoException {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
    this.name = 'ResourceNotFoundException'
  }
}

export class ConflictException extends MomoException {
  constructor(message: string = 'Conflict') {
    super(message, 409)
    this.name = 'ConflictException'
  }
}

export class InternalServerErrorException extends MomoException {
  constructor(message: string = 'Internal server error') {
    super(message, 500)
    this.name = 'InternalServerErrorException'
  }
}

export function createException(status: number, message?: string): MomoException {
  switch (status) {
    case 400:
      return new BadRequestException(message)
    case 401:
      return new InvalidSubscriptionKeyException(message)
    case 404:
      return new ResourceNotFoundException(message)
    case 409:
      return new ConflictException(message)
    case 500:
      return new InternalServerErrorException(message)
    default:
      return new MomoException(message ?? `HTTP error ${status}`, status)
  }
}
