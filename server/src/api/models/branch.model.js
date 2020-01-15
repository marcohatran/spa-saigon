const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const jwt = require("jwt-simple");
const uuidv4 = require("uuid/v4");
const APIError = require("../utils/APIError");
const { env, jwtSecret, jwtExpirationInterval } = require("../../config/vars");

/**
 * Branch Schema
 * @private
 */
const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 2,
      maxlength: 128,
      uppercase: true,
      trim: true,
      unique: true
    }
  },
    {
        timestamps: true
    }
);

/**
 * Methods
 */
branchSchema.method({
  transform() {
    const transformed = {};
    const fields = ["id", "name"];

    fields.forEach(field => {
      transformed[field] = this[field];
    });

    return transformed;
  }
});

/**
 * Statics
 */
branchSchema.statics = {
  /**
   * Get branch
   *
   * @param {ObjectId} id - The objectId of branch.
   * @returns {Promise<Branch, APIError>}
   */
  async get(id) {
    try {
      let branch;

      if (mongoose.Types.ObjectId.isValid(id)) {
        branch = await this.findById(id).exec();
      }
      if (branch) {
        return branch;
      }

      throw new APIError({
        message: "Branch does not exist",
        status: httpStatus.NOT_FOUND
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * List branchs in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of branchs to be skipped.
   * @param {number} limit - Limit number of branchs to be returned.
   * @returns {Promise<Branch[]>}
   */
  list({ page = 1, perPage = 30, name }) {
    const options = omitBy({ name }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
    //   .skip(perPage * (page - 1))
    //   .limit(perPage)
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateBranchname(error) {
    if (error.name === "MongoError" && error.code === 11000) {
      return new APIError({
        message: "Validation Error",
        errors: [
          {
            field: "name",
            location: "body",
            messages: ["'branch' already exists"]
          }
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack
      });
    }
    return error;
  }
};

/**
 * @typedef Branch
 */
module.exports = mongoose.model("Branch", branchSchema);
