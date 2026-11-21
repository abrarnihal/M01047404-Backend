# BrightSteps Coursework API

Express and MongoDB API for the CST3144 Full Stack Development coursework. The project uses the official MongoDB Node.js driver directly; it does not use Mongoose.

## Run locally in VS Code

1. Install Node.js 20.6 or newer.
2. In the VS Code terminal, open this folder and install packages:

   ```sh
   npm install
   ```

3. Create a MongoDB Atlas cluster, database user, and network access rule. Copy the Atlas connection string, replace its username and password, then place it in a local `.env` file based on `.env.example`:

   ```text
   PORT=3000
   MONGODB_URI=mongodb+srv://<database-user>:<password>@<cluster-address>/
   DB_NAME=brightsteps
   FRONTEND_ORIGIN=https://abrarnihal.github.io
   ```

   For local development, add `http://localhost:5173` as an additional comma-separated `FRONTEND_ORIGIN` value. Keep the real `.env` file private; Git ignores it.

4. Insert the sample data into empty collections:

   ```sh
   npm run seed
   ```

   The seed command creates ten lessons, five teachers, and their `teacherId` relationships. It skips any collection that already contains records.

5. Start the API:

   ```sh
   npm run dev
   ```

   Open `http://localhost:3000/health`. The class images are served from `/lesson-images/`.

## MongoDB Compass

Connect Compass with the same Atlas URI used in `.env`. Open the `brightsteps` database and inspect `lessons`, `teachers`, and `orders`. Export the `lessons` and `teachers` collections from Compass for the coursework submission.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Confirms the service is running. |
| `GET` | `/lessons` | Returns the lesson catalogue. |
| `GET` | `/lessons/search?q=art&minPrice=8&maxPrice=15&available=true` | Searches lesson title, subject, and location, with optional price and availability filters. |
| `PUT` | `/lessons/:id` | Updates one or more allowed lesson attributes, such as `spaces`, `price`, or `location`. |
| `POST` | `/orders` | Saves customer name, phone, lesson IDs, and booking time in the `orders` collection. |
| `GET` | `/teachers` | Returns teachers with their linked lesson counts. |
| `GET` | `/teachers/:id/lessons` | Returns a teacher and their associated lessons. |
| `GET` | `/enrolment/:lessonid` | Returns the number of reserved places for one lesson. |
| `GET` | `/lesson-images/:filename` | Serves a lesson image; a missing image returns JSON with status `404`. |

The request logger prints the timestamp, HTTP method, and URL. Unknown API routes return a JSON `404` response.

## Postman

Import [`postman/CST3144-BrightSteps.postman_collection.json`](postman/CST3144-BrightSteps.postman_collection.json). Its `baseUrl` variable defaults to `http://localhost:3000`. First request `GET /lessons`, copy a lesson `_id` into the collection's `lessonId` variable, then use it in the order, update, and enrolment requests. The `teacherId` variable defaults to `olivia-bennett`.

## Render and GitHub Pages

Create a Render Web Service from the public backend repository. Set **Build Command** to `npm install` and **Start Command** to `npm start`. Add `MONGODB_URI`, `DB_NAME=brightsteps`, and `FRONTEND_ORIGIN=https://abrarnihal.github.io` as Render environment variables. In the frontend GitHub repository, set the Actions variable `VITE_API_URL` to the Render service URL and redeploy the Pages site.

Keep database credentials in the local `.env` and Render environment settings; never commit them.
