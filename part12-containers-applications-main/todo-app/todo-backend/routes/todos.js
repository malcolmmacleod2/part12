const express = require('express');
const { Todo } = require('../mongo')
const redis = require('../redis')
const router = express.Router();

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })
  res.send(todo);

  const current = await redis.getAsync('added_todos')
  const added_todos = Number(current)

  await redis.setAsync('added_todos', added_todos + 1)
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => { 
  const todo = await req.todo
  res.send(todo);
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {

  await Todo.findByIdAndUpdate(
    req.todo.id,
    {
      text: req.body.text,
      done: req.body.done ?? false
    }
  )

  const updated = await Todo.findById(req.todo.id)

  res.send(updated);
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
