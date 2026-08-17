import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";

import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import { getLeads, bulkImportLeads } from "../services/leadService";

const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F4F6FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

const SOLAR_REQUIREMENT_OPTIONS = ["Residential", "Commercial"];
const LEAD_SOURCE_OPTIONS = ["Website", "Call", "Reference", "Facebook", "Google", "Other"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const INTEREST_OPTIONS = ["Pending", "Interested", "Not Interested"];

const SAMPLE_HEADERS = [
  "customer_name", "mobile_number", "alternate_number", "email", "address",
  "city", "state", "pincode", "solar_requirement", "interest_status",
  "required_kw", "lead_source", "priority", "remark",
];
const SAMPLE_ROW = [
  "Ramesh Kumar", "9876543210", "9876543211", "ramesh@example.com", "123 MG Road",
  "Jaipur", "Rajasthan", "302001", "Residential", "Interested",
  "5", "Website", "Medium", "Interested in rooftop solar",
];

const getFieldValue = (row, key, altKey) => {
  const val = row[key] ?? row[altKey] ?? row[key?.replace(/_/g, " ")] ?? "";
  return typeof val === "string" ? val.trim() : val;
};

const validateRow = (row, existingMobiles) => {
  const errors = [];

  const customer_name = String(getFieldValue(row, "customer_name", "Customer Name") || "");
  const mobile_number = String(getFieldValue(row, "mobile_number", "Mobile Number") || "").replace(/\D/g, "").slice(0, 10);
  const alternate_number = String(getFieldValue(row, "alternate_number", "Alternate Number") || "").replace(/\D/g, "").slice(0, 10);
  const email = String(getFieldValue(row, "email", "Email") || "");
  const address = String(getFieldValue(row, "address", "Address") || "");
  const city = String(getFieldValue(row, "city", "City") || "");
  const state = String(getFieldValue(row, "state", "State") || "");
  const pincode = String(getFieldValue(row, "pincode", "Pincode") || "");
  const solar_requirement = String(getFieldValue(row, "solar_requirement", "Solar Requirement") || "Residential");
  const interest_status = String(getFieldValue(row, "interest_status", "Interest Status") || "Pending");
  const required_kw = getFieldValue(row, "required_kw", "Required kW");
  const lead_source = String(getFieldValue(row, "lead_source", "Lead Source") || "Other");
  const priority = String(getFieldValue(row, "priority", "Priority") || "Medium");
  const remark = String(getFieldValue(row, "remark", "Remark") || "");

  if (!customer_name) errors.push("Customer name is required");
  if (!mobile_number || mobile_number.length !== 10) errors.push("Invalid or missing 10-digit mobile number");
  if (solar_requirement && !SOLAR_REQUIREMENT_OPTIONS.includes(solar_requirement)) {
    errors.push(`Invalid solar_requirement: "${solar_requirement}"`);
  }
  if (lead_source && !LEAD_SOURCE_OPTIONS.includes(lead_source)) {
    errors.push(`Invalid lead_source: "${lead_source}"`);
  }
  if (priority && !PRIORITY_OPTIONS.includes(priority)) {
    errors.push(`Invalid priority: "${priority}"`);
  }
  if (interest_status && !INTEREST_OPTIONS.includes(interest_status)) {
    errors.push(`Invalid interest_status: "${interest_status}"`);
  }
  if (interest_status === "Interested" && (!required_kw || Number(required_kw) <= 0)) {
    errors.push("Required kW is mandatory when Interest Status is Interested");
  }
  if (interest_status === "Not Interested" && !remark) {
    errors.push("Remark is mandatory when Interest Status is Not Interested");
  }

  const isDuplicate = mobile_number.length === 10 && existingMobiles.has(mobile_number);

  return {
    customer_name, mobile_number, alternate_number, email, address, city, state, pincode,
    solar_requirement, interest_status, required_kw, lead_source, priority, remark,
    _status: errors.length > 0 ? "invalid" : isDuplicate ? "duplicate" : "valid",
    _errors: errors,
  };
};

const StatusChip = ({ status }) => {
  if (status === "valid") {
    return <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: "0.9rem !important" }} />} label="Valid" size="small" sx={{ backgroundColor: COLORS.successSoft, color: COLORS.success, fontWeight: 700, fontSize: "0.68rem", height: 22 }} />;
  }
  if (status === "duplicate") {
    return <Chip icon={<WarningAmberIcon sx={{ fontSize: "0.9rem !important" }} />} label="Duplicate" size="small" sx={{ backgroundColor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 700, fontSize: "0.68rem", height: 22 }} />;
  }
  return <Chip icon={<ErrorOutlineIcon sx={{ fontSize: "0.9rem !important" }} />} label="Invalid" size="small" sx={{ backgroundColor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 700, fontSize: "0.68rem", height: 22 }} />;
};

const ImportLeadsDialog = ({ open, onClose, onImportComplete, showSnackbar }) => {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setStep(1);
    setFileName("");
    setRows([]);
    setIncludeDuplicates(false);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleDownloadSample = useCallback(() => {
    const csv = [SAMPLE_HEADERS.join(","), SAMPLE_ROW.join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setFileName(file.name);
    setParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        showSnackbar("The file appears to be empty.", "error");
        setParsing(false);
        return;
      }

      // Fetch existing mobile numbers once, for duplicate detection
      let existingMobiles = new Set();
      try {
        const res = await getLeads({ page: 1, limit: 5000 });
        if (res?.success) {
          existingMobiles = new Set((res.data || []).map((l) => String(l.mobile_number || "").trim()));
        }
      } catch (err) {
        // If this fails, we simply skip duplicate-detection rather than blocking the import
      }

      const validated = json.map((row) => validateRow(row, existingMobiles));
      setRows(validated);
      setStep(2);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to read the file. Please check the format and try again.", "error");
    } finally {
      setParsing(false);
    }
  }, [showSnackbar]);

  const validCount = rows.filter((r) => r._status === "valid").length;
  const duplicateCount = rows.filter((r) => r._status === "duplicate").length;
  const invalidCount = rows.filter((r) => r._status === "invalid").length;
  const importableCount = includeDuplicates ? validCount + duplicateCount : validCount;

  const handleImport = useCallback(async () => {
    const toImport = rows.filter((r) => r._status === "valid" || (includeDuplicates && r._status === "duplicate"));
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      const payload = toImport.map(({ _status, _errors, ...rest }) => rest);
      const res = await bulkImportLeads(payload);
      if (res?.success) {
        setImportResult(res.data);
        setStep(3);
        onImportComplete?.();
      } else {
        showSnackbar(res?.message || "Import failed.", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Import failed. Please try again.", "error");
    } finally {
      setImporting(false);
    }
  }, [rows, includeDuplicates, onImportComplete, showSnackbar]);

  return (
    <Dialog
      open={open}
      onClose={importing ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px", maxHeight: "88vh", overflow: "hidden" } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2.2, borderBottom: `1px solid ${COLORS.border}` }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary }}>Import Leads</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textMuted, mt: 0.2 }}>
            {step === 1 && "Step 1 of 3 — Upload a CSV or Excel file"}
            {step === 2 && "Step 2 of 3 — Review and confirm"}
            {step === 3 && "Step 3 of 3 — Import complete"}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={importing} sx={{ backgroundColor: "#F1F5F9", borderRadius: "8px" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* ============ STEP 1: UPLOAD ============ */}
        {step === 1 && (
          <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
            <Box
              sx={{
                width: "100%", border: `2px dashed ${COLORS.border}`, borderRadius: "14px",
                py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                backgroundColor: "#FAFBFC", transition: "border-color 0.2s ease",
                "&:hover": { borderColor: COLORS.primary },
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 44, color: COLORS.primary }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: COLORS.textPrimary }}>
                {parsing ? "Reading file..." : "Choose a CSV or Excel file"}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textMuted }}>Supported formats: .csv, .xlsx, .xls</Typography>

              <Button
                component="label"
                variant="contained"
                disabled={parsing}
                startIcon={parsing ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon sx={{ fontSize: 18 }} />}
                sx={{
                  mt: 1, textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3,
                  backgroundColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                {parsing ? "Reading..." : "Browse File"}
                <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              </Button>
              {fileName && !parsing && (
                <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.5 }}>Selected: {fileName}</Typography>
              )}
            </Box>

            <Button
              variant="text"
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              onClick={handleDownloadSample}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8rem", color: COLORS.primary }}
            >
              Download Sample CSV Template
            </Button>

            <Box sx={{ width: "100%", p: 2, borderRadius: "10px", backgroundColor: COLORS.primarySoft, border: `1px solid ${COLORS.primary}30` }}>
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.primaryDark, fontWeight: 600, lineHeight: 1.6 }}>
                Required columns: <strong>customer_name</strong>, <strong>mobile_number</strong>. All other columns are optional — imported leads always start as "New Lead" and unassigned.
              </Typography>
            </Box>
          </Box>
        )}

        {/* ============ STEP 2: PREVIEW ============ */}
        {step === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 3, py: 2, display: "flex", gap: 1.5, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.border}`, backgroundColor: "#FAFBFC" }}>
              <Chip label={`${validCount} Valid`} size="small" sx={{ backgroundColor: COLORS.successSoft, color: COLORS.success, fontWeight: 700 }} />
              <Chip label={`${duplicateCount} Duplicate`} size="small" sx={{ backgroundColor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 700 }} />
              <Chip label={`${invalidCount} Invalid`} size="small" sx={{ backgroundColor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 700 }} />
              <Box sx={{ flex: 1 }} />
              {duplicateCount > 0 && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={includeDuplicates} onChange={(e) => setIncludeDuplicates(e.target.checked)} />}
                  label={<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textSecondary }}>Include duplicate leads</Typography>}
                />
              )}
            </Box>

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#F8FAFC", fontWeight: 800, fontSize: "0.68rem" }}>#</TableCell>
                    <TableCell sx={{ backgroundColor: "#F8FAFC", fontWeight: 800, fontSize: "0.68rem" }}>Status</TableCell>
                    <TableCell sx={{ backgroundColor: "#F8FAFC", fontWeight: 800, fontSize: "0.68rem" }}>Customer</TableCell>
                    <TableCell sx={{ backgroundColor: "#F8FAFC", fontWeight: 800, fontSize: "0.68rem" }}>Mobile</TableCell>
                    <TableCell sx={{ backgroundColor: "#F8FAFC", fontWeight: 800, fontSize: "0.68rem" }}>City</TableCell>
                    <TableCell sx={{ backgroundColor: "#F8FAFC", fontWeight: 800, fontSize: "0.68rem" }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        backgroundColor: row._status === "invalid" ? COLORS.dangerSoft : row._status === "duplicate" ? COLORS.warningSoft : "transparent",
                      }}
                    >
                      <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{idx + 1}</TableCell>
                      <TableCell><StatusChip status={row._status} /></TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{row.customer_name || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem" }}>{row.mobile_number || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>{row.city || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        {row._status === "invalid" ? row._errors.join("; ") : row._status === "duplicate" ? "Mobile number already exists" : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ============ STEP 3: RESULT ============ */}
        {step === 3 && importResult && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: "18px", backgroundColor: COLORS.successSoft, color: COLORS.success,
                display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2,
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary, mb: 0.5 }}>Import Complete</Typography>
            <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, mb: 3 }}>
              <strong style={{ color: COLORS.success }}>{importResult.imported}</strong> leads imported successfully
              {importResult.failed > 0 && (
                <>
                  {" "}· <strong style={{ color: COLORS.danger }}>{importResult.failed}</strong> failed
                </>
              )}
            </Typography>

            {importResult.errors?.length > 0 && (
              <Box sx={{ textAlign: "left", maxHeight: 220, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: "10px", p: 1.5 }}>
                {importResult.errors.map((e, idx) => (
                  <Typography key={idx} sx={{ fontSize: "0.75rem", color: COLORS.danger, mb: 0.5 }}>
                    Row {e.row}: {e.reason}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.2, borderTop: `1px solid ${COLORS.border}` }}>
        {step === 2 && (
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => { setStep(1); setRows([]); setFileName(""); }}
            disabled={importing}
            sx={{ textTransform: "none", fontWeight: 700, color: COLORS.textSecondary }}
          >
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {step !== 3 && (
          <Button onClick={handleClose} disabled={importing} sx={{ textTransform: "none", fontWeight: 700, color: COLORS.textSecondary }}>
            Cancel
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importing || importableCount === 0}
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3, backgroundColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryDark } }}
          >
            {importing ? "Importing..." : `Import ${importableCount} Lead${importableCount === 1 ? "" : "s"}`}
          </Button>
        )}
        {step === 3 && (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3, backgroundColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryDark } }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportLeadsDialog;