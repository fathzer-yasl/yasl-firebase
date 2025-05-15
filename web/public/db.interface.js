export default class DatabaseInterface {
  // Get all lists for the current user
  async getLists() { throw "Not implemented"; }

  // Get a single list by its ID
  async getList(id) { throw "Not implemented"; }

  // Create or update a list (if id exists, update; else create)
  async putList(id, data) { throw "Not implemented"; }

  // Delete a list by its ID
  async deleteList(id) { throw "Not implemented"; }
}
