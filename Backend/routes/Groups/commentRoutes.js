const express = require('express');
const router = express.Router();
const { addComment, editComment, deleteComment } = require('../../db/Groups/commentDb');

router.post('/add', async (req, res) => {
    try {
        const { groupId, content } = req.body;
        const result = await addComment(groupId, req.userId, content);
        return res.status(result.code).json({ group: result.result });
    } catch (err) {
        console.error('addGroupComment error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

router.post('/edit', async (req, res) => {
    try {
        const { groupId, commentId, content } = req.body;
        const result = await editComment(groupId, req.userId, commentId, content);
        return res.status(result.code).json({ group: result.result });
    } catch (err) {
        console.error('editGroupComment error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

router.post('/delete', async (req, res) => {
    try {
        const { groupId, commentId } = req.body;
        const result = await deleteComment(groupId, req.userId, commentId);
        return res.status(result.code).json({ group: result.result });
    } catch (err) {
        console.error('deleteGroupComment error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
