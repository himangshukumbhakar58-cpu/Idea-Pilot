const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            default: "General",
            trim: true
        },

        suggestions: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["Draft", "In Progress", "Completed"],
            default: "Draft"
        },

        platform: {
            type: String,
            default: "YouTube"
        },

        niche: {
            type: String,
            default: ""
        },

        topic: {
            type: String,
            default: ""
        },

        audience: {
            type: String,
            default: ""
        },

        objective: {
            type: String,
            default: ""
        },

        language: {
            type: String,
            default: "English"
        },

        goal: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Idea = mongoose.model("Idea", ideaSchema);

module.exports = Idea;
