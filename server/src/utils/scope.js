// Admins see all lenders' data; everyone else only sees what they created.
function ownerScope(req) {
  return req.user.role === "admin" ? {} : { createdBy: req.user.id };
}

module.exports = { ownerScope };
