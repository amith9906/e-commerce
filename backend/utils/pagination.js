'use strict';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

const parsePaginationParams = (query = {}) => {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(MAX_LIMIT, Math.trunc(rawLimit)) : DEFAULT_LIMIT;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginationMeta = (count, { page, limit }) => {
  const totalPages = Math.max(1, Math.ceil(count / limit));
  return {
    total: count,
    pages: totalPages,
    currentPage: page,
    limit,
  };
};

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
};
