/**
 * Generic data-access wrapper around a Mongoose model. Services depend on
 * repositories (not models directly) so query logic stays out of business
 * logic and can be swapped/mocked.
 */
export default class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  insertMany(docs) {
    return this.model.insertMany(docs);
  }

  findById(id, { populate = [], select = null, lean = false } = {}) {
    let q = this.model.findById(id);
    if (select) q = q.select(select);
    populate.forEach((p) => (q = q.populate(p)));
    if (lean) q = q.lean();
    return q;
  }

  findOne(filter = {}, { populate = [], select = null, lean = false } = {}) {
    let q = this.model.findOne(filter);
    if (select) q = q.select(select);
    populate.forEach((p) => (q = q.populate(p)));
    if (lean) q = q.lean();
    return q;
  }

  find(filter = {}, { populate = [], select = null, sort = { createdAt: -1 }, skip = 0, limit = 0, lean = true } = {}) {
    let q = this.model.find(filter);
    if (select) q = q.select(select);
    populate.forEach((p) => (q = q.populate(p)));
    if (sort) q = q.sort(sort);
    if (skip) q = q.skip(skip);
    if (limit) q = q.limit(limit);
    if (lean) q = q.lean();
    return q;
  }

  /** Paginated fetch returning { items, total }. */
  async paginate(filter = {}, { page = 1, limit = 12, skip = 0, ...opts } = {}) {
    const [items, total] = await Promise.all([
      this.find(filter, { ...opts, skip, limit }),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  exists(filter = {}) {
    return this.model.exists(filter);
  }

  updateById(id, update, opts = { new: true }) {
    return this.model.findByIdAndUpdate(id, update, opts);
  }

  updateOne(filter, update, opts = { new: true }) {
    return this.model.findOneAndUpdate(filter, update, opts);
  }

  updateMany(filter, update) {
    return this.model.updateMany(filter, update);
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  deleteMany(filter) {
    return this.model.deleteMany(filter);
  }

  aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}
