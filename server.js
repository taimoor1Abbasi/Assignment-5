/*********************************************************************************
 *  WEB322 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Taimoor Abbasi Student ID: 157265216 Date: 2023-03-30
 *
 *  Cyclic Web App URL: ________________________________________________________
 *
 *  GitHub Repository URL: ______________________________________________________
 *
 ********************************************************************************/

const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const stripJs = require("strip-js");
const blogData = require("./blog-service.js");
const {
  initialize,
  getAllPosts,
  getCategories,
  addPost,
  getPostsByMinDate,
  addCategory,
  deleteCategoryById,
  getPostById,
  getPublishedPostsByCategory,
  deletePostById,
} = require("./blog-service.js");
const app = express();
app.use(express.static("public"));
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});
app.use(express.urlencoded({ extended: true }));
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      },
    },
  })
);
app.set("view engine", ".hbs");

cloudinary.config({
  cloud_name: "dlxaiazfi",
  api_key: "261461771716615",
  api_secret: "Zi0PtccMGW6pL2RCte0KbJ5ew2o",
  secure: true,
});
const HTTP_PORT = 8080;
const upload = multer();
app.get("/", (req, res) => {
  res.redirect("/blog");
});

app.get("/blog", async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogData.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let post = posts[0];
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blogData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  if (viewData.posts.length > 0) {
    res.render("blog", { data: viewData });
  } else {
    res.render("blog", {
      data: viewData,
      message: "Please try another category",
    });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/posts", (req, res) => {
  console.log(req.query.category);
  if (req.query.category) {
    getPublishedPostsByCategory(req.query.category)
      .then((data) => {
        data.length > 0 ? res.render("posts", { posts: data }) : res.render("posts", { message: "No Results" });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }

  else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate)
      .then((data) => {
        data.length > 0 ? res.render("posts", { posts: data }) : res.render("posts", { message: "No Results" });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }

  else {
    getAllPosts()
      .then((data) => {
        data.length > 0? res.render("posts", { posts: data }): res.render("posts", { message: "No Results" });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

app.get("/posts/add", (req, res) => {
  getCategories()
    .then((categories) => {
      res.render("addPost", { categories: categories });
    })
    .catch(() => {
      res.render("addPost", { categories: [] });
    });
});

app.get("/post/:value", (req, res) => {
  getPostById(req.params.value)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.send(err);
    });
});


app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    return result;
  }

  upload(req)
    .then((uploaded) => {
      req.body.featureImage = uploaded.url;
      let postObject = {};

      postObject.body = req.body.body;
      postObject.title = req.body.title;
      postObject.postDate = new Date().toISOString().slice(0, 10);
      postObject.category = req.body.category;
      postObject.featureImage = req.body.featureImage;
      postObject.published = req.body.published;

      if (postObject.title) {
        addPost(postObject).then(() => {
          res.redirect("/posts");
        });
      }
    })
    .catch((err) => {
      res.send(err);
    });
});


app.get("/categories", (req, res) => {
  getCategories()
    .then((data) => {
      data.length > 0
        ? res.render("categories", { categories: data })
        : res.render("categories", { message: "No Results" });
    })
    .catch(() => {
      res.render("categories", { message: "no results" });
    });
});

app.get("/blog/:id", async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogData.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blogData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});


app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
  let catObject = {};
  catObject.category = req.body.category;
  console.log(req.body.category);
  if (req.body.category != "") {
    addCategory(catObject)
      .then(() => {
        res.redirect("/categories");
      })
      .catch(() => {
        console.log("ERROR");
      });
  }
});

app.get("/categories/delete/:id", (req, res) => {
  deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch(() => {
      console.log("Unable to remove category");
    });
});

app.get("/posts/delete/:id", (req, res) => {
  deletePostById(req.params.id)
    .then(() => {
      res.redirect("/posts");
    })
    .catch(() => {
      console.log("Unable to remove category");
    });
});

app.use((req, res) => {
  res.status(404).render("404");
});

initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log("Express http server listening on: " + HTTP_PORT);
  });
});
