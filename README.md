# H5P AI Generator

H5P AI Generator is a stateless Next.js 14 app that turns pasted content into editable H5P True/False questions. The API route calls OpenAI for JSON question generation, and each reviewed question can be downloaded as its own `.h5p` file from the browser.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` and set your OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- OpenAI runs in `app/api/generate/true-false/route.ts` and `app/api/generate/question-set/route.ts`.
- JSZip runs only in the browser through `lib/generateH5P.ts`.
- The MVP creates one `.h5p` file per True/False question.
