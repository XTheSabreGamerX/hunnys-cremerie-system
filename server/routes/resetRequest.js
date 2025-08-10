const express = require("express");
const router = express.Router();
const {
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
} = require("../controllers/resetRequestController");

router.get('/', getResetRequests);

router.post('/', createResetRequest);

router.put('/', approveResetRequest);

router.delete('/', rejectResetRequest);

module.exports = router;