# BrightSteps Coursework API

Express and MongoDB API for the CST3144 Full Stack Development coursework. The project uses the official MongoDB Node.js driver directly; it does not use Mongoose.

## Run locally in VS Code

1. Install Node.js 20.19 or newer (Node 24 is used for the Render service).
2. In the VS Code terminal, open this folder and install packages:

   ```sh
   npm install
   ```

3. Create a MongoDB Atlas cluster, database user, and network access rule. Put the Atlas connection string in a local `.env` file based on `.env.example`:

   ```text
   PORT=3000
   MONGODB_URI=mongodb+srv://<database-user>:<password>@<cluster-address>/
   DB_NAME=brightsteps
   FRONTEND_ORIGIN=https://abrarnihal.github.io
   ```

   For local development, add `http://localhost:5173` as an additional comma-separated `FRONTEND_ORIGIN` value. Keep the real `.env` file private; Git ignores it.

4. Insert the sample data into the `lesson` and `teacher` collections:

   ```sh
   npm run seed
   ```

   The seed command creates ten lessons with five spaces each, five teachers with first and last names, and their `teacherId` relationships. It skips any collection that already contains records.

5. Start the API:

   ```sh
   npm run dev
   ```

   Open `http://localhost:3000/health`. The class images are served from `/lesson-images/`.

   Render runs `npm start`, which seeds the sample `lesson` and `teacher` collections if either is empty, then starts the API. The seed step does not overwrite existing records.

## MongoDB Compass

Connect Compass with the same Atlas URI used in `.env`. Open the `brightsteps` database and inspect the `lesson`, `teacher`, and `order` collections. Render seeds ten lessons and five linked teachers; a successful booking creates the `order` collection. Export all three collections from Compass as JSON into `MongoDB-Exports` after the demo booking has been created. Keep these exports in sync with the final Atlas data.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Confirms the service is running. |
| `GET` | `/lessons` | Returns the lesson catalogue. |
| `GET` | `/lessons/search?q=art&minPrice=8&maxPrice=15&available=true` | Searches title, topic, location, price, remaining-space count, and availability words; optional numeric price and availability filters can be combined. |
| `PUT` | `/lessons/:id` | Updates one or more lesson attributes, including `topic`, `space`, `price`, or `location`; `subject` and `spaces` are accepted as compatibility aliases. |
| `POST` | `/orders` | Saves customer name, phone, one `lessonIDs` entry per reserved space, total `spaces`, and booking time in the `order` collection. |
| `GET` | `/teachers` | Returns teachers with their linked lesson counts. |
| `GET` | `/teachers/:id/lessons` | Returns a teacher and their associated lessons. |
| `GET` | `/enrolment/:lessonid` | Back-end-only coursework route returning the purchased-space count for one lesson. The frontend does not call it. |
| `GET` | `/lesson-images/:filename` | Serves a lesson image; a missing image returns JSON with status `404`. |

The request logger prints the timestamp, HTTP method, and URL. Unknown API routes return a JSON `404` response. Each teacher has `firstName` and `lastName`; lessons link to a teacher through `teacherId`.

## Postman

Import [`postman/CST3144-BrightSteps.postman_collection.json`](postman/CST3144-BrightSteps.postman_collection.json). Its `baseUrl` variable defaults to the live Render API. Change it to `http://localhost:3000` when running locally. Run `GET /lessons` first; its Postman script stores the first lesson ID as `lessonId` for the order, update, and enrolment requests. The `teacherId` variable defaults to `olivia-bennett`. The collection includes search, teacher association, image success and missing-image responses, an arbitrary lesson-attribute update, and an unknown-route 404 request.

## Render and GitHub Pages

The live API is [`https://m01047404-cst3144-api.onrender.com`](https://m01047404-cst3144-api.onrender.com); its live lesson catalogue is [`/lessons`](https://m01047404-cst3144-api.onrender.com/lessons). The frontend is published at [`https://abrarnihal.github.io/cst3144-frontend/`](https://abrarnihal.github.io/cst3144-frontend/). The Render Blueprint sets the student-ID service name `m01047404-cst3144-api`, Frankfurt region, `/health` check, Node 24, build command `npm install`, and start command `npm start`.

Keep database credentials in the local `.env` and Render environment settings; never commit them.

