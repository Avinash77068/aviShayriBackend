import BaseRepository from "./base.repository.js";
import { User } from "../models/index.js";

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmail(email, { withPassword = false } = {}) {
    const q = this.model.findOne({ email: String(email).toLowerCase() });
    if (withPassword) q.select("+password");
    return q;
  }

  emailExists(email, ignoreId = null) {
    const filter = { email: String(email).toLowerCase() };
    if (ignoreId) filter._id = { $ne: ignoreId };
    return this.model.exists(filter);
  }
}

export const userRepository = new UserRepository();
export default userRepository;
