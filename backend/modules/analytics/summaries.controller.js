'use strict';
const sequelize = require('../../config/database');
const { StoreRevenueSummary, SalesPersonPerformanceSummary } = require('../../models');

const refreshStoreRevenueSummary = async (tenantId, transaction) => {
  await sequelize.query(
    `WITH aggregated AS (
      SELECT store_id, SUM(amount) AS total_revenue, COUNT(id) AS invoice_count
      FROM billing_records
      WHERE tenant_id = :tenantId
      GROUP BY store_id
    )
    INSERT INTO store_revenue_summaries (tenant_id, store_id, total_revenue, invoice_count, created_at, updated_at)
    SELECT :tenantId, store_id, total_revenue, invoice_count, NOW(), NOW()
    FROM aggregated
    ON CONFLICT (tenant_id, store_id) DO UPDATE SET
      total_revenue = EXCLUDED.total_revenue,
      invoice_count = EXCLUDED.invoice_count,
      updated_at = EXCLUDED.updated_at;`,
    { replacements: { tenantId }, transaction }
  );

  await sequelize.query(
    `DELETE FROM store_revenue_summaries
     WHERE tenant_id = :tenantId
       AND store_id NOT IN (
         SELECT DISTINCT store_id FROM billing_records WHERE tenant_id = :tenantId
       );`,
    { replacements: { tenantId }, transaction }
  );
};

const refreshSalesPersonPerformanceSummary = async (tenantId, transaction) => {
  await sequelize.query(
    `WITH aggregated AS (
      SELECT sales_person_id, SUM(quantity) AS total_units, SUM(total_amount) AS total_amount
      FROM inventory_transfers
      WHERE tenant_id = :tenantId AND sales_person_id IS NOT NULL
      GROUP BY sales_person_id
    )
    INSERT INTO sales_person_performance_summaries (tenant_id, sales_person_id, total_units, total_amount, created_at, updated_at)
    SELECT :tenantId, sales_person_id, total_units, total_amount, NOW(), NOW()
    FROM aggregated
    ON CONFLICT (tenant_id, sales_person_id) DO UPDATE SET
      total_units = EXCLUDED.total_units,
      total_amount = EXCLUDED.total_amount,
      updated_at = EXCLUDED.updated_at;`,
    { replacements: { tenantId }, transaction }
  );

  await sequelize.query(
    `DELETE FROM sales_person_performance_summaries
     WHERE tenant_id = :tenantId
       AND sales_person_id NOT IN (
         SELECT DISTINCT sales_person_id FROM inventory_transfers WHERE tenant_id = :tenantId AND sales_person_id IS NOT NULL
       );`,
    { replacements: { tenantId }, transaction }
  );
};

const refreshSummaries = async (req, res, next) => {
  try {
    await sequelize.transaction(async (tx) => {
      await refreshStoreRevenueSummary(req.tenant.id, tx);
      await refreshSalesPersonPerformanceSummary(req.tenant.id, tx);
    });
    res.json({ success: true, message: 'Summaries refreshed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { refreshSummaries };

