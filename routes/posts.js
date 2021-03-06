const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

const { check, validationResult } = require('express-validator');

// Api for creating a post

router.post('/', [ auth,
    // text is required
    check('text', 'Text is required.')
    .not()
    .isEmpty()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findOne({_id: req.user.id});

        let post = new Post({
            text: req.body.text,
            user: user,
            name: user.name,
            avatar: user.avatar
        });

        post = await post.save();
        res.json(post);
    } catch(err){
        console.log(err);
        res.status(500).send('Server Error');
    }
})

// Api for getting all posts

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find({});
    
        res.json(posts);
    } catch(err){
        console.log(err);
        res.status(500).send('Server error');
    }
});

// Api to get post with given id

router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findOne({_id: req.params.post_id});
    
        if(!post){
            return res.status(400).json({msg: 'Post not found'});
        }

        res.json(post);
    } catch(err){
        console.log(err);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Post not found'});
        }
        res.status(500).send('Server error');
    }
});

// Api to delete post with given id

router.delete('/:post_id', auth, async (req, res) => {

    try {
        // Delete post
        await Post.findOneAndRemove({_id: req.params.post_id});
        res.json({msg: 'Post deleted successfully.'});        
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }

})

// Api to like a post

router.put('/:post_id/like', auth, async (req, res) => {
    try {
        let post = await Post.findOne({_id: req.params.post_id})
        if(!post){
            return res.status(400).json({msg: 'Post not found'});
        }

        const likeExists = post.likes.filter(like => like.user.toString() === req.user.id).length > 0;

        if(likeExists){
            return res.status(400).json({msg: 'Post already liked.'});
        }
        post.likes.unshift({user: req.user.id});
        await post.save();
        res.json(post.likes);

    } catch (err) {
        console.log(err);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Post not found'});
        }
        res.status(500).send('Server error');
    }
})

// Api to dislike a post

router.put('/:post_id/dislike', auth, async (req, res) => {
    try {
        let post = await Post.findOne({_id: req.params.post_id})
        if(!post){
            return res.status(400).json({msg: 'Post not found'});
        }

        const likeExists = post.likes.filter(like => like.user.toString() === req.user.id).length > 0;

        if(!likeExists){
            return res.status(400).json({msg: 'Post has not been liked yet.'});
        }
        
        const removeIndex = post.likes.map(like => like.user.id).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);

    } catch (err) {
        console.log(err);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Post not found'});
        }
        res.status(500).send('Server error');
    }
})

// Api for commenting on a post

router.put('/:post_id/comments', [auth,
    // text is required
    check('text', 'Text is required.')
    .not()
    .isEmpty()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findOne({_id: req.user.id});
        let post = await Post.findOne({_id: req.params.post_id});

        let newComment = {
            text: req.body.text,
            user: user,
            name: user.name,
            avatar: user.avatar
        }

        post.comments.unshift(newComment);
        post = await post.save();
        res.json(post.comments);
    } catch(err){
        console.log(err);
        res.status(500).send('Server Error');
    }
})

// Api to delete a comment on a post

router.delete('/:post_id/comments/:comment_id', auth, async (req, res) => {
    try {
        let post = await Post.findOne({_id: req.params.post_id})
        if(!post){
            return res.status(400).json({msg: 'Post not found'});
        }

        if(!post.comments.filter(comment => comment.id === req.params.comment_id).length > 0){
            return res.status(400).json({msg: 'Comment not found.'});
        }

        const removeIndex = post.comments.map(comment => comment.id).indexOf(req.params.comment_id);

        if(post.comments[removeIndex].user != req.user.id){
            return res.status(401).json({msg: 'User not authorized.'});
        }
        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);

    } catch (err) {
        console.log(err);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Post not found'});
        }
        res.status(500).send('Server error');
    }
})

module.exports = router;