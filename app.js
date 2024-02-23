const express = require('express')
const app = express()
require('./database/config')
const cors = require('cors')
const Admin = require('./database/adminSchema')
app.use(cors())
app.use(express.json())
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authenticate = require('./middleware/authenticate')
const multer = require('multer')
app.use("/uploads", express.static('./uploads'))
const Product = require('./database/productSchema')
const path = require('path')
const moment = require('moment')
const Category = require('./database/categorySchema')

//Admin Registration
app.post('/register', async (req, res) => {
  const { name, email, password, rpassword } = req.body
  if (!name || !email || !password || !rpassword) {
    res.status(422).send({ status: 422, msg: 'Please Fill All Details' })
  }
  try {
    const preuser = await Admin.findOne({ email: email })
    if (preuser) {
      res.status(401).send({
        status: 401,
        success: false,
        msg: 'This Email is Already Exist'
      })
    } else if (password !== rpassword) {
      res.status(422).send({ status: 422, msg: 'Password and Confirm Password not Match' })
    }
    else {
      let admin = new Admin(req.body)
      //here password hashing
      let result = await admin.save()
      res.status(200).send({
        status: 201,
        success: true,
        data: result,
        msg: 'Registration Sucessfull'
      })
    }
  } catch (error) {
    res.status(401).send({ status: 401, success: false, msg: error.message })
  }
})

//Admin Login
app.post('/login', async (req, res) => {
  const { email, pwd } = req.body
  if (!email || !pwd) {
    res.status(422).send({ status: 401, msg: 'Please Fill All Details' })
  }
  try {
    const userValid = await Admin.findOne({ email: email })
    if (userValid) {
      //compare password
      var isMatch = await bcrypt.compare(pwd, userValid.password)
      if (!isMatch) {
        res.status(422).send({ status: 422, msg: 'Invalid Details' })
      } else {
        //token generation
        const token = await userValid.generateAuthToken()
        console.log(token);
        const result = {
          userValid,
          token
        }
        res.status(201).send({ status: 201, msg: 'Login Sucessfull', result })
      }
    } else {
      res.status(422).send({ status: 422, msg: 'Email ID is not valid' })
    }
  } catch (error) {
    res.status(401).send({ status: 401, msg: error.message })
  }
})

/*Validate User to Access Admin dashboard using Token */
app.get('/validAdminUser', authenticate, async (req, res) => {
  try {
    const validUserOne = await Admin.findOne({ _id: req.userId })
    res.status(201).send({ status: 201, validUserOne })
  } catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//logout Admin
app.get('/logout', authenticate, async (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter(curElm => {
      return curElm.token !== req.token
    })
    req.rootUser.save()
    res.status(201).send({ status: 201, msg: 'Log out sucessfully' })
  } catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//Product Page
//img storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'product_image') {
      cb(null, 'uploads') // Specify the destination directory for uploaded files
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    )
  }
})

//img filter
const isImage = (Req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true)

  } else {
    cb(null, false)
    return cb(new Error('Only .jpg,.png,.jpeg format allowed'))
  }
}

// // Create multer instance with the storage configuration
// // const maxSize = 1 * 1024 * 10224 //1MB
var upload = multer({
  storage: storage,
  fileFilter: isImage
  // limits: { fileSize: maxSize }
})

app.post('/add_products', upload.single('product_image'), async (req, res) => {
  const file = req.file.filename
  const { product_name, pack_size, price, category, status } = req.body
  if (!product_name || !pack_size || !price || !category || !file || !status) {
    res.status(401).send({ status: 401, msg: 'All Inputs is Required' })
  }
  try {
    const datecreated = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
    const productData = new Product({
      product_name, pack_size, price, category, Status: status, product_image: file, dateCreated: datecreated
    })
    const data = await productData.save()
    res.status(201).send({ status: 201, data })
  }
  catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//get Products Data
app.get('/getData', authenticate, async (req, res) => {
  try {
    let data = await Product.find()
    res.status(201).send({ status: 201, msg: data })
  } catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//get single product data
app.get('/single_product_get/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const productData = await Product.findOne({ _id: id })
    res.status(201).send({ status: 201, msg: productData })
  }
  catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//edit product
app.put('/product_edit/:id', upload.single('product_image'), async (req, res) => {
  const { id } = req.params;
  const { product_name, pack_size, price, category, status, product_image } = req.body
  const file = req.file ? req.file.filename : product_image
  
  const dateUpdated = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
  try {
    const updateProduct = await Product.findByIdAndUpdate({ _id: id }, {
      product_name, pack_size, price, category, Status: status, product_image:file, dateUpdated
    }, {
      new: true
    })
    await updateProduct.save()
    res.status(201).send({ status: 201, msg: updateProduct })
  } catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//delete product
app.delete('/product_delete/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const delProduct = await Product.findByIdAndDelete({ _id: id })
    res.status(201).send({ status: 201, msg: delProduct })
  }
  catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//search Category product
app.get('/search_category_product/:key',authenticate, async (req, res) => {
  try {
    let result = await Product.find({
      "$or": [
        { product_name: { $regex: req.params.key } }
      ]
    })
    res.status(201).send({ status: 201, msg: result })
  }
  catch {
    res.status(401).send({ status: 401, msg: error })
  }
})


//Category Page

//Add category
app.post('/add_category', authenticate,async (req, res) => {
  const { category, description, status } = req.body
  if (!category || !description || !status) {
    res.status(401).send({ status: 401, msg: 'All Inputs is Required' })
  }
  try {
    const datecreated = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
    const categoryData = new Category({
      category, description, Status: status, dateCreated: datecreated
    })
    const data = await categoryData.save()
    res.status(201).send({ status: 201, data })
  }
  catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//get Category Data
app.get('/getCategoryData', authenticate, async (req, res) => {
  try {
    let data = await Category.find()
    res.status(201).send({ status: 201, msg: data })
  } catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//delete category
app.delete('/categoryDelete/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Category.findByIdAndDelete({ _id: id })
    res.send({ status: 201, msg: data })
  }
  catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//get single ctegory data
app.get('/single_category_get/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const productData = await Category.findOne({ _id: id })
    if (res) {
      res.status(201).send({ status: 201, msg: productData })
    } else {
      res.status(401).send({ status: 401, msg: 'No Record Found' })
    }
  }
  catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//edit category
app.put('/category_edit/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { category, description, status } = req.body

  const dateUpdated = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
  try {
    const updateData = await Category.findByIdAndUpdate({ _id: id }, {
      category, description, Status: status, dateUpdated
    }, {
      new: true
    })
    await updateData.save()
    res.status(201).send({ status: 201, msg: updateData })
  } catch (error) {
    res.status(401).send({ status: 401, msg: error })
  }
})

//search Category
app.get('/search_category/:key',authenticate, async (req, res) => {
  try {
    let result = await Category.find({
      "$or": [
        { category: { $regex: req.params.key } }
      ]
    })
    res.status(201).send({ status: 201, msg: result })
  }
  catch {
    res.status(401).send({ status: 401, msg: error })
  }
})

app.get('/', (req, res) => {
  res.status(201).json('server created')
})

app.listen(5000, () => {
  console.log('server started');
})