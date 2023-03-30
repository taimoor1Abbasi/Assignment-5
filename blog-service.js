const Sequelize = require("sequelize");
const { gte } = Sequelize.Op;

var sequelize = new Sequelize('ujficfid', 'ujficfid', '5JpnHMO0kISZG-3gF7jnZa4IGbfHQxx2', {
  host: 'isilo.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

const Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Post.belongsTo(Category, { foreignKey: "category" });

function getAllPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject("Cannot sync to the database.");
      });
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        id: id,
      },
    })
      .then((data) => {
        resolve(data[0]);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category: category,
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category: category,
      },
    })
      .then((data) => {
        console.log(category);
        resolve(data);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function getPostsByMinDate(minDate) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results");
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve("Complete");
      })
      .catch(() => {
        reject("Cannot delete category");
      });
  });
}

function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve("Complete");
      })
      .catch(() => {
        reject("Cannot delete post");
      });
  });
}

function addPost(postData) {
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;
    for (const i in postData) {
      if (postData[i] === "") {
        postData[i] = null;
      }
    }
    postData.postDate = new Date();
    Post.create(postData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Cannot create post");
      });
  });
}

function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    for (let i in categoryData) {
      if (categoryData[i] === "") {
        categoryData[i] = null;
      }
    }

    Category.create(categoryData)
      .then((category) => {
        resolve(category);
      })
      .catch(() => {
        reject("Cannot create category");
      });
  });
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostById,
  getPostsByMinDate,
  getPublishedPostsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
  getPostsByCategory,
};