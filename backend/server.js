const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

// Import Idea Model
const Idea = require("./models/Idea");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Status
app.get("/api/db-status", (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        success: connected,
        database: connected ? "Connected" : "Disconnected"
    });
});

// Test API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Idea-Pilot Backend is running!"
    });
});

// CREATE IDEA API
app.post("/api/ideas", async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            suggestions,
            status,
            platform,
            niche,
            topic,
            audience,
            objective,
            language,
            goal
        } = req.body;

        const cleanTitle = (title || topic || "").trim();
        const cleanDescription = (description || audience || cleanTitle || "").trim();

        if (!cleanTitle || !cleanDescription) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const newIdea = new Idea({
            title: cleanTitle,
            description: cleanDescription,
            category: (category || niche || "General").trim(),
            suggestions: Array.isArray(suggestions) ? suggestions : [],
            status: status || "Draft",
            platform: platform || "YouTube",
            niche: niche || category || "",
            topic: topic || cleanTitle,
            audience: audience || cleanDescription,
            objective: objective || "",
            language: language || "English",
            goal: goal || ""
        });

        const savedIdea = await newIdea.save();

        res.status(201).json({
            success: true,
            message: "Idea saved successfully!",
            idea: savedIdea
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET ALL IDEAS
app.get("/api/ideas", async (req, res) => {
    try {
        const ideas = await Idea.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: ideas.length,
            ideas: ideas
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// UPDATE IDEA
app.put("/api/ideas/:id", async (req, res) => {
    try {
        const updatedIdea = await Idea.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedIdea) {
            return res.status(404).json({
                success: false,
                message: "Idea not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Idea updated successfully!",
            idea: updatedIdea
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE IDEA
app.delete("/api/ideas/:id", async (req, res) => {
    try {
        const deletedIdea = await Idea.findByIdAndDelete(
            req.params.id
        );

        if (!deletedIdea) {
            return res.status(404).json({
                success: false,
                message: "Idea not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Idea deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start Server
const PORT = process.env.PORT || 5001;

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing in .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected Successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Startup Error:", error.message);
        process.exit(1);
    }
}

// Database Monitoring
mongoose.connection.on("disconnected", () => {
    console.log("MongoDB Disconnected!");
});

if (require.main === module) {
    startServer();
}

module.exports = app;
