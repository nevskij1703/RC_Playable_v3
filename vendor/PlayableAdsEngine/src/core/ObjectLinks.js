class ObjectLinks {
  constructor() {
    this.links = {}
  }

  get(linkID, context, ...args) {
    switch (typeof linkID) {
      case 'function':
        return this.get(linkID.call(context, ...args), context)
      case 'number':
      case 'string':
        if (!this.links[linkID]) {
          throw new Error(`Missing objectLinkID: ${linkID}`)
        }

        return this.links[linkID]
      default:
        return linkID
    }
  }

  set(linkID, object) {
    if (linkID === undefined) {
      throw new Error(`Trying to set objectLinkID with "undefined" value for "${object.name}"`)
    }

    if (this.links[linkID]) {
      throw new Error(`Duplicate objectLinkID: ${linkID}`)
    }

    this.links[linkID] = object
  }

  reassign(linkID, object) {
    this.links[linkID] = null

    this.set(linkID, object)
  }
}

export default new ObjectLinks()
