const express = require("express");
const cors = require("cors");
const multer = require("multer");
const otpGenerator = require('otp-generator')
const fs = require("fs/promises");
const path = require("path");
const app = express();

require("dotenv").config();

app.use(cors({
    // origin: process.env.CLIENT,
    origin: '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
  }));
  
const port = process.env.PORT || 3001;

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
fs.mkdir(uploadDir, { recursive: true }).catch((err) => {
  console.error("Error creating uploads directory:", err);
});

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/post", upload.single("file"), async (req, res) => {
  // Access the file through req.file
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
      const fileId = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
      // Save the file to the server's disk
      const filePath = path.join(uploadDir, `${fileId}_${req.file.originalname}`);
      await fs.writeFile(filePath, req.file.buffer);
      // Create a download link for the file
      // Do something with the file data or send a response back to the client
      return res.status(200).json({ fileId });
  } catch (err) {
      const fileId = 0;
      return res.json(500).json({fileId});
  }
});

app.get("/download/:fileId", async (req, res) => {
  const { fileId } = req.params;
  // Retrieve the file path based on fileId
  const files = await fs.readdir(uploadDir);
  const matchingFile = files.find((file) => file.startsWith(`${fileId}_`));
  if (!matchingFile) {
    return res.status(404).send("File not found.");
  }
  const filePath = path.join(uploadDir, matchingFile);
  // Set appropriate headers for file download
  res.setHeader("Content-Disposition", `attachment; filename=${matchingFile}`);
  res.sendFile(filePath);
});

app.delete("/delete/:fileId", async (req, res) => {
    const { fileId } = req.params;
    // Retrieve the file path based on fileId
    const files = await fs.readdir(uploadDir);
    const matchingFile = files.find((file) => file.startsWith(`${fileId}_`));
    if (!matchingFile) {
      return res.status(404).send("File not found.");
    }
    const filePath = path.join(uploadDir, matchingFile);
  
    try {
      // Delete the file from the server's disk
      await fs.unlink(filePath);
      return res.status(200).send("File deleted successfully.");
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).send("Internal Server Error");
    }
  });
  

app.listen(port, () => {
  console.log(`server started on port: ${port}`);
});