const roarContainer = document.querySelector(".roar__container");
const form = document.querySelector("form");
const API_URL = "http://localhost:5000/roars";
const allRoarsBtn = document.getElementById("all-roars-btn");
const activeTags = document.querySelector(".active-tags");
// const tagLink = document.querySelectorAll("span");
const searchBar = document.querySelector(".search-bar");
const inputTags = document.getElementById("tags");
const loadOverlay = document.getElementById("load-overlay");

listAllRoars();

// Loading screen
loadOverlay.style.display = "none";

// Check over 140 characters
const roarContent = document.getElementById("content");

roarContent.addEventListener("input", (e) => {
  let sentence = e.target.value.replace(/\s+|\n+/g, "");

  if (sentence.length < 120) {
    roarContent.style.outlineColor = "blue";
  } else {
    roarContent.style.outlineColor = "orange";
  }
});

// Form to add roars from users
form.addEventListener("submit", (event) => {
  event.preventDefault();

  loadOverlay.style.display = "";
  const formData = new FormData(form);
  const name = formData.get("name");
  const content = formData.get("content");

  const roar = {
    name,
    content,
  };

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(roar),
    headers: {
      "content-type": "application/json",
    },
  })
    .then((newRoar) => newRoar.json())
    .then(() => {
      // console.log(roar);
      form.reset();
      loadOverlay.style.display = "none";
      listAllRoars();
    });

  // console.log(roar);
});

allRoarsBtn.addEventListener("click", () => {
  activeTags.innerHTML = "";
  listAllRoars();
});

document.addEventListener("click", (e) => {
  if (
    e.target.matches("span") &&
    e.target.getAttribute("class") == "tag-link"
  ) {
    // for tag links inside the single roar
    let tag = e.target.textContent;
    let queryTag = tag.match(/^#/) ? tag.slice(1, tag.length) : tag;
    // console.log(queryTag);
    listTagRoars(queryTag);
  } else if (
    e.target.matches("span") &&
    e.target.getAttribute("class") == "close-tag"
  ) {
    // for tag links opened for search
    let tagId = e.target.getAttribute("dataset");
    let tagElement = document.querySelector(`.active-tags #${tagId}`);
    tagElement.remove();
    requestTag();
  } else if (
    e.target.matches("h3") &&
    e.target.getAttribute("class") == "author"
  ) {
    let author = e.target.textContent;
    clearTags();
    listAuthorRoars(author);
  } else if (
    e.target.matches("span") &&
    e.target.getAttribute("class") == "author-link"
  ) {
    let name = e.target.textContent;
    name = name.slice(1, name.length);
    clearTags();
    listAuthorRoars(name);
  } else {
    return;
  }
});

function putRoarsOnPage(data) {
  let roars = data.roars;
  // console.log(roars.length);
  if (roars.length > 0) {
    roarContainer.innerHTML = "";
    roars.forEach((roar) => {
      let div = document.createElement("div");
      div.classList.add("roar");

      let heading = document.createElement("h3");
      heading.classList.add("author");
      heading.textContent = roar.name;

      let contentDiv = document.createElement("div");
      contentDiv.classList.add("roar__content");

      let content = document.createElement("p");
      let contentElements = roar.content.split(
        /(#[a-z0-9]{1,30})|(@[a-z0-9\-]{1,30})/i
      );

      contentElements = contentElements.filter((chunk) => chunk !== undefined);
      // console.log(contentElements);
      contentElements.forEach((element) => {
        let newSpan = document.createElement("span");
        newSpan.textContent = element;
        if (element.match(/^#/)) {
          newSpan.classList.add("tag-link");
        } else if (element.match(/^@/)) {
          newSpan.classList.add("author-link");
        }
        content.appendChild(newSpan);
      });

      let date = document.createElement("span");
      date.classList.add("date");
      date.textContent = new Date(roar.created).toDateString();

      contentDiv.appendChild(content);
      contentDiv.appendChild(date);
      div.appendChild(heading);
      div.appendChild(contentDiv);

      roarContainer.appendChild(div);
    });
  } else {
    let notFound = document.createElement("h2");
    notFound.textContent = "No roar found!";
    roarContainer.innerHTML = "";
    roarContainer.appendChild(notFound);
  }
}

// Makes a request to the API for all roars and create and add elements to the page
function listAllRoars() {
  // console.log("All roars");
  fetch(API_URL, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((docs) => {
      putRoarsOnPage(docs);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Makes a request to the API for tagged roars and create and add elements to the page
function listTagRoars(tag) {
  // console.log("Tagged roars");
  fetch(`${API_URL}/tags?tags=${tag}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((docs) => {
      putRoarsOnPage(docs);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Request for roars based on author
function listAuthorRoars(author) {
  // console.log("All roars");
  fetch(`${API_URL}/author?name=${author}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((docs) => {
      putRoarsOnPage(docs);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Function to add tags to the page
function addTag(tag) {
  let newDiv = document.createElement("div");
  newDiv.classList.add("active-tag");

  // Slug Tag
  let tagSlug = tag.replace(/\s+/g, "-");
  newDiv.setAttribute("id", tagSlug);

  // Small tag element
  let newTag = document.createElement("small");
  newTag.textContent = tag;

  // Span for close tag action
  let closeSpanBtn = document.createElement("span");
  closeSpanBtn.classList.add("close-tag");
  closeSpanBtn.setAttribute("dataset", tagSlug);
  closeSpanBtn.innerHTML = "&times;";

  // add new elements to newDiv
  newDiv.appendChild(newTag);
  newDiv.appendChild(closeSpanBtn);

  activeTags.appendChild(newDiv);

  requestTag();
}

// Input validation for query in search bar
const tagRegExp = new RegExp(",$");
const authorRegExp = new RegExp("^@");

inputTags.addEventListener("keydown", (e) => {
  // console.log(e.code);
  if (e.code == "Enter") {
    e.preventDefault();
    let query = e.target.value;

    // Author starts with @
    if (authorRegExp.test(query)) {
      let name = query.replace("@", "");
      listAuthorRoars(name);
      searchBar.reset();
      clearTags();
    } else if (query.trim() !== "") {
      addTag(query);
      searchBar.reset();
    } else {
      return;
    }
  }
});

// Listener for input tags
// inputTags.addEventListener("input", (e) => {
//   let value = e.target.value;
//   if (tagRegExp.test(value)) {
//     let tag = value.split(/,/);
//     if (tag && tag[0].trim() !== "") {
//       addTag(tag[0]);
//       searchBar.reset();
//     }
//   }
// });

function requestTag() {
  let allActiveTags = document.querySelectorAll(
    ".active-tags .active-tag small"
  );

  // console.log(allActiveTags);

  if (allActiveTags.length == 0) {
    listAllRoars();
  } else {
    let queryString = Array.from(allActiveTags)
      .map((small) => small.textContent)
      .join(",");

    listTagRoars(queryString);
  }
}

function clearTags() {
  activeTags.innerHTML = "";
}

// Parallax effect for Dinos Illustrations
const brachio = document.getElementById("brachio");
const triceps = document.getElementById("triceps");
const stego = document.getElementById("stego");
const tRex = document.getElementById("t-rex");

function parallax(element, distance, speed) {
  element.style.transform = `translateY(${distance * speed}px)`;
}

window.addEventListener("scroll", () => {
  parallax(brachio, window.scrollY, 0.3);
  parallax(triceps, window.scrollY, 0.4);
  parallax(stego, window.scrollY, 0.5);
  parallax(tRex, window.scrollY, 0.3);
});
