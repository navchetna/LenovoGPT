"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  CircularProgress,
} from "@mui/material"
import DescriptionIcon from "@mui/icons-material/Description"
import DeleteIcon from "@mui/icons-material/Delete"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorIcon from "@mui/icons-material/Error"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import PendingIcon from "@mui/icons-material/Pending"
import ComputerIcon from "@mui/icons-material/Computer"
import { CHAT_QNA_URL, DATAPREP_URL } from "@/lib/constants"

type Category = "GENERAL" | "HCI" | "AI"
type UploadStatus = "pending" | "uploading" | "success" | "error"

interface FileItem {
  id: string
  name: string
  size: string
  uploadDate: string
  category: Category
  uploadStatus?: UploadStatus
  errorMessage?: string
}

const demoFiles: FileItem[] = [
  { id: "1", name: "ThinkSystem_SR650_V3_Datasheet.pdf", size: "2.3 MB", uploadDate: "2024-01-15", category: "GENERAL", uploadStatus: "success" },
  { id: "2", name: "ThinkAgile_VX_Series_Guide.pdf", size: "3.1 MB", uploadDate: "2024-01-12", category: "HCI", uploadStatus: "success" },
  { id: "3", name: "ThinkSystem_SR670_V2_AI_Config.pdf", size: "4.2 MB", uploadDate: "2024-01-10", category: "AI", uploadStatus: "success" },
]

export default function FileManagerPage() {
  const [allFiles, setAllFiles] = useState<FileItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category>("GENERAL")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Configuration
  const DB_NAME = "lenovo-db"

  useEffect(() => {
    fetchUploadedFiles()
  }, [])

  const fetchUploadedFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${CHAT_QNA_URL}/api/files?db_name=${DB_NAME}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`)
      }
      
      const data = await response.json()
      
      const transformedFiles: FileItem[] = data.files.map((file: any) => ({
        id: file.id,
        name: file.file_name,
        size: file.file_size,
        uploadDate: new Date(file.upload_date).toISOString().split("T")[0],
        category: file.collection_name as Category,
        uploadStatus: file.upload_status as UploadStatus || "success"
      }))
      
      setAllFiles(transformedFiles)
      console.log(`Loaded ${transformedFiles.length} files from backend`)
    } catch (error) {
      console.error("Error fetching files:", error)
      showToast("Failed to load files from server", "error")
      setAllFiles(demoFiles)
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const recordFileUpload = async (fileName: string, collectionName: string, fileSize: string) => {
    try {
      const response = await fetch(`${CHAT_QNA_URL}/api/files/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: fileName,
          collection_name: collectionName,
          file_size: fileSize,
          db_name: DB_NAME,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to record file: ${response.status}`)
      }

      const data = await response.json()
      console.log("File upload recorded:", data.file_record)
      return data.file_record
    } catch (error) {
      console.error("Error recording file upload:", error)
      return null
    }
  }

  const uploadToQdrant = async (file: File, collectionName: string): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append("files", file)
      formData.append("collection_name", collectionName)

      const response = await fetch(`${DATAPREP_URL}/v1/dataprep/ingest`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  const handleCategoryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    setIsUploading(true)

    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const fileId = `uploaded-${Date.now()}-${i}`
      const fileSize = `${(file.size / 1024 / 1024).toFixed(1)} MB`

      const newFile: FileItem = {
        id: fileId,
        name: file.name,
        size: fileSize,
        uploadDate: new Date().toISOString().split("T")[0],
        category: selectedCategory,
        uploadStatus: "pending" as UploadStatus,
      }

      setAllFiles((prev) => [...prev, newFile])

      setAllFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, uploadStatus: "uploading" as UploadStatus } : f
        )
      )

      try {
        await uploadToQdrant(file, selectedCategory)
        await recordFileUpload(file.name, selectedCategory, fileSize)
        
        setAllFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, uploadStatus: "success" as UploadStatus } : f
          )
        )
        successCount++
      } catch (error) {
        setAllFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  uploadStatus: "error" as UploadStatus,
                  errorMessage: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        )
        failedCount++
      }
    }

    setIsUploading(false)

    if (successCount > 0 && failedCount === 0) {
      showToast(`Successfully uploaded ${successCount} file(s) to ${selectedCategory} collection`, "success")
    } else if (successCount > 0 && failedCount > 0) {
      showToast(`Uploaded ${successCount} file(s), ${failedCount} failed`, "error")
    } else {
      showToast(`Failed to upload ${failedCount} file(s)`, "error")
    }

    event.target.value = ""
  }

  const handleRetryUpload = async (fileId: string) => {
    const file = allFiles.find((f) => f.id === fileId)
    if (!file) return

    setAllFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, uploadStatus: "uploading" as UploadStatus, errorMessage: undefined } : f
      )
    )

    showToast("Retry functionality requires file re-selection", "error")
    
    setAllFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, uploadStatus: "error" as UploadStatus, errorMessage: "Please re-upload the file" } : f
      )
    )
  }

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      setAllFiles((prev) => prev.filter((file) => file.id !== fileToDelete))
      showToast("File has been removed from the list", "success")
    }
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }

  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case "GENERAL":
        return "rgba(227, 6, 19, 0.15)"
      case "HCI":
        return "rgba(255, 107, 0, 0.15)"
      case "AI":
        return "rgba(0, 180, 216, 0.15)"
      default:
        return "rgba(128, 128, 128, 0.15)"
    }
  }

  const getCategoryTextColor = (cat: Category) => {
    switch (cat) {
      case "GENERAL":
        return "#E30613"
      case "HCI":
        return "#ff6b00"
      case "AI":
        return "#00b4d8"
      default:
        return "#808080"
    }
  }

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
      case "error":
        return <ErrorIcon sx={{ color: "#ef4444", fontSize: 18 }} />
      case "uploading":
        return <CircularProgress size={16} sx={{ color: "#f59e0b" }} />
      case "pending":
        return <PendingIcon sx={{ color: "#6b7280", fontSize: 18 }} />
      default:
        return null
    }
  }

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case "success":
        return "Uploaded"
      case "error":
        return "Failed"
      case "uploading":
        return "Uploading..."
      case "pending":
        return "Pending"
      default:
        return "Unknown"
    }
  }

  const sortedFiles = [...allFiles].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Box sx={{ mb: 2 }}>
          <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="700" fill="#E30613" letterSpacing="-1">
              Lenovo
            </text>
          </svg>
        </Box>
        <Typography
          variant="h3"
          sx={{
            mb: 0.5,
            color: "#ffffff",
            fontWeight: "800",
            fontSize: { xs: "1.8rem", md: "2rem" },
            letterSpacing: "-0.02em",
          }}
        >
          Server Documentation Manager
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "#b0b0b0",
            fontWeight: "400",
            fontSize: { xs: "1rem", md: "1rem" },
            maxWidth: 600,
            mx: "auto",
            lineHeight: 1.5,
          }}
        >
          Manage and organize your server documentation by category
        </Typography>
      </Box>

      {/* Toast Message */}
      {toastMessage && (
        <Box
          sx={{
            position: "fixed",
            top: 20,
            right: 20,
            backgroundColor: toastType === "success" ? "#10b981" : "#ef4444",
            color: "white",
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            zIndex: 1000,
          }}
        >
          <Typography variant="body2">{toastMessage}</Typography>
        </Box>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ color: "#E30613", fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Confirm File Deletion
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: '#b0b0b0' }}>
            Are you sure you want to remove this file from the list? This will not delete it from the Qdrant collection.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            sx={{
              borderColor: "rgba(255, 255, 255, 0.3)",
              color: "#b0b0b0",
              "&:hover": { borderColor: "white", color: 'white' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: "#E30613",
              "&:hover": { backgroundColor: "#c9050f" },
            }}
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      <Box
        sx={{
          backgroundColor: "#2d2d2d",
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(227, 6, 19, 0.2)",
          overflow: "hidden",
          height: { xs: "calc(100vh - 180px)", md: "calc(100vh - 200px)" },
        }}
      >
        <Box sx={{ display: "flex", height: "100%" }}>
          {/* Left side */}
          <Box sx={{ flex: { xs: 1, lg: 2 }, display: "flex", flexDirection: "column", p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "#ffffff", fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                {isLoading ? "Loading Files..." : "All Files"}
              </Typography>
              <Chip
                label={`${allFiles.length} files total`}
                sx={{
                  backgroundColor: "#E30613",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  height: "32px",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              />
            </Box>

            <TableContainer
              component={Paper}
              sx={{
                flex: 1,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                borderRadius: 2,
                overflow: "auto",
                bgcolor: '#1a1a1a',
                scrollBehavior: "smooth",
                "&::-webkit-scrollbar": {
                  width: '8px',
                },
                "&::-webkit-scrollbar-track": {
                  background: '#1a1a1a',
                },
                "&::-webkit-scrollbar-thumb": {
                  background: '#E30613',
                  borderRadius: '4px',
                },
              }}
            >
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        py: 2,
                        fontSize: "0.9rem",
                        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      File Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        py: 2,
                        fontSize: "0.9rem",
                        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                        width: "100px",
                      }}
                    >
                      Size
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        py: 2,
                        fontSize: "0.9rem",
                        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                        width: "120px",
                      }}
                    >
                      Upload Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        py: 2,
                        fontSize: "0.9rem",
                        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                        width: "130px",
                      }}
                    >
                      Category
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        py: 2,
                        fontSize: "0.9rem",
                        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                        width: "120px",
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        textAlign: "center",
                        py: 2,
                        fontSize: "0.9rem",
                        width: "80px",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, bgcolor: '#1a1a1a', borderBottom: 'none' }}>
                        <CircularProgress size={24} sx={{ color: "#E30613" }} />
                        <Typography variant="body2" sx={{ mt: 1, color: "#b0b0b0" }}>
                          Loading files from server...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : sortedFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, bgcolor: '#1a1a1a', borderBottom: 'none' }}>
                        <Typography variant="body1" sx={{ color: "#b0b0b0", mb: 1 }}>
                          No files uploaded yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#808080" }}>
                          Upload your first document using the panel on the right
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedFiles.map((file, index) => (
                      <TableRow
                        key={file.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(227, 6, 19, 0.1)",
                            transform: "translateX(2px)",
                            transition: "all 0.2s ease",
                          },
                          height: "60px",
                          backgroundColor: index % 2 === 0 ? "#1a1a1a" : "rgba(255, 255, 255, 0.02)",
                          transition: "all 0.2s ease",
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <TableCell sx={{ py: 2, px: 2.5, borderRight: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <DescriptionIcon
                              sx={{
                                color: "#E30613",
                                fontSize: 22,
                                transition: "transform 0.2s ease",
                                "&:hover": { transform: "scale(1.1)" },
                              }}
                            />
                            <Typography
                              variant="body1"
                              fontWeight={500}
                              sx={{
                                color: "#ffffff",
                                fontSize: "0.9rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "200px",
                              }}
                            >
                              {file.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2, px: 2.5, borderRight: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.85rem", fontWeight: 500, color: '#b0b0b0' }}
                          >
                            {file.size}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2, px: 2.5, borderRight: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.85rem", fontWeight: 500, color: '#b0b0b0' }}
                          >
                            {file.uploadDate}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2, px: 2.5, borderRight: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <Chip
                            label={file.category}
                            size="small"
                            sx={{
                              backgroundColor: getCategoryColor(file.category),
                              color: getCategoryTextColor(file.category),
                              fontSize: "0.7rem",
                              height: "24px",
                              fontWeight: 600,
                              px: 0.5,
                              border: `1px solid ${getCategoryTextColor(file.category)}`,
                              transition: "transform 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.05)",
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2, px: 2.5, borderRight: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {getStatusIcon(file.uploadStatus || "success")}
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color:
                                  file.uploadStatus === "success"
                                    ? "#10b981"
                                    : file.uploadStatus === "error"
                                    ? "#ef4444"
                                    : file.uploadStatus === "uploading"
                                    ? "#f59e0b"
                                    : "#6b7280",
                              }}
                            >
                              {getStatusText(file.uploadStatus || "success")}
                            </Typography>
                          </Box>
                          {file.errorMessage && (
                            <Typography
                              variant="caption"
                              sx={{ color: "#ef4444", fontSize: "0.65rem", display: "block", mt: 0.5 }}
                              title={file.errorMessage}
                            >
                              {file.errorMessage.length > 20 ? `${file.errorMessage.substring(0, 20)}...` : file.errorMessage}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2, px: 2.5 }}>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            {file.uploadStatus === "error" && (
                              <IconButton
                                size="small"
                                onClick={() => handleRetryUpload(file.id)}
                                sx={{
                                  color: "#f59e0b",
                                  "&:hover": {
                                    color: "#d97706",
                                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                                    transform: "scale(1.15)",
                                  },
                                  width: 32,
                                  height: 32,
                                  transition: "all 0.2s ease",
                                }}
                                title="Retry upload"
                              >
                                <CloudUploadIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(file.id)}
                              sx={{
                                color: "#ef4444",
                                "&:hover": {
                                  color: "#dc2626",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  transform: "scale(1.15)",
                                },
                                width: 32,
                                height: 32,
                                transition: "all 0.2s ease",
                              }}
                              title="Remove from list"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Right side */}
          <Box
            sx={{
              flex: { xs: 0, lg: 1 },
              display: { xs: "none", lg: "flex" },
              flexDirection: "column",
              minWidth: "350px",
              maxWidth: "400px",
              p: 3,
              backgroundColor: "#1a1a1a",
              borderLeft: "1px solid rgba(227, 6, 19, 0.2)",
            }}
          >
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: "#ffffff", fontSize: "1.5rem" }}>
              Upload New Files
            </Typography>

            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel
                  component="legend"
                  sx={{ mb: 2, fontWeight: 600, color: "#ffffff", fontSize: "1.1rem" }}
                >
                  Select Server Category
                </FormLabel>
                <RadioGroup
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category)}
                  sx={{ gap: 1 }}
                >
                  {(["GENERAL", "HCI", "AI"] as Category[]).map((cat) => (
                    <FormControlLabel
                      key={cat}
                      value={cat}
                      control={
                        <Radio
                          sx={{
                            color: "rgba(255, 255, 255, 0.3)",
                            "&.Mui-checked": {
                              color: getCategoryTextColor(cat),
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontWeight: 500, fontSize: "0.9rem", color: '#ffffff' }}>
                            {cat === "GENERAL" ? "General Purpose" : cat}
                          </Typography>
                          
                        </Box>
                      }
                      sx={{
                        margin: 0,
                        padding: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        "&:hover": {
                          backgroundColor: getCategoryColor(cat) + '40',
                          borderColor: getCategoryTextColor(cat),
                        },
                        ...(selectedCategory === cat && {
                          backgroundColor: getCategoryColor(cat) + '40',
                          borderColor: getCategoryTextColor(cat),
                          border: `2px solid ${getCategoryTextColor(cat)}`,
                        }),
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>

            <Box
              sx={{
                border: "3px dashed rgba(255, 255, 255, 0.2)",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                backgroundColor: "#2d2d2d",
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(227, 6, 19, 0.05)",
                  borderColor: "#E30613",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(227, 6, 19, 0.3)",
                },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "#E30613", mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1.5, fontSize: "1.3rem", fontWeight: 600, color: "#ffffff" }}>
                Drop files here
              </Typography>
              <Typography variant="body1" sx={{ mb: 1.5, fontSize: "0.9rem", color: "#b0b0b0" }}>
                Selected collection: <strong style={{ color: getCategoryTextColor(selectedCategory) }}>
                  {selectedCategory === "GENERAL" ? "General Purpose" : selectedCategory}
                </strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, fontSize: "0.85rem", color: "#808080" }}>
                or click to browse files
              </Typography>
              <input
                type="file"
                multiple
                onChange={handleCategoryFileUpload}
                style={{ display: "none" }}
                id="category-file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                disabled={isUploading}
              />
              <label htmlFor="category-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  disabled={isUploading}
                  size="large"
                  startIcon={isUploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                  sx={{
                    backgroundColor: "#E30613",
                    color: "white",
                    fontWeight: 600,
                    px: 3,
                    py: 1.2,
                    fontSize: "0.95rem",
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: "#c9050f",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(227, 6, 19, 0.5)",
                    },
                    "&:disabled": {
                      backgroundColor: "#5a5a5a",
                      color: "#808080",
                    },
                  }}
                >
                  {isUploading ? "Uploading..." : "Choose Files"}
                </Button>
              </label>
              
              {isUploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#b0b0b0" }}>
                    Processing files to Qdrant...
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: "rgba(0, 180, 216, 0.1)", 
              borderRadius: 2, 
              border: "1px solid rgba(0, 180, 216, 0.3)" 
            }}>
              <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#00b4d8", fontWeight: 500 }}>
                <ComputerIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                Files will be uploaded to the selected server category collection in Qdrant vector database.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}