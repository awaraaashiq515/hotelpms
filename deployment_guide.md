# 🚀 Project Deployment Guide (Website Ko Live Kaise Karein)

Is file mein aapko apni website (**posendwebsite**) ko live karne ke liye zaroori saare steps aur **AI Prompts** mil jayenge. Aap isse kisi bhi AI tool (jaise ChatGPT, Claude, ya Antigravity) ko dekar help le sakte hain.

---

## 1. 🇮🇳 Hinglish Version (Aapki Bhasha Mein)

Agar aap kisi AI se website live karwana chahte hain, to yeh text copy karein:

### Prompt:
"Meri **Next.js** website ko live karne mein meri help karein. Abhi yeh mere computer par **SQLite** (`dev.db`) use kar rahi hai, lekin live website ke liye humein **PostgreSQL** chahiye hoga.

Humein niche diye gaye kaam karne hain:
1. **Prisma Update:** `schema.prisma` ko 'sqlite' se 'postgresql' par convert karein.
2. **GitHub Setup:** Is pore project ko ek private GitHub repository mein push karein.
3. **Database Hosting:** **Neon.tech** ya **Supabase** par ek naya PostgreSQL database banayein.
4. **Vercel Deployment:** Project ko Vercel se connect karein aur saare environment variables (`DATABASE_URL`, `JWT_SECRET`) setup karein.
5. **Auto-Build:** Ensure karein ke build ke waqt `npx prisma generate` command chale.

Mujhe har step ke liye zaroori commands aur settings batayein."

---

## 2. 🇬🇧 English Version (Professional Prompt)

Use this professional version for the best results with any AI coding assistant:

### Prompt:
"Help me deploy my **Next.js (App Router)** project to a production environment. The project currently uses **Prisma** with a local **SQLite** database, which needs to be migrated to **PostgreSQL**.

**Specific Requirements:**
1. **Schema Migration:** Update `prisma/schema.prisma` to use the `postgresql` provider and ensure compatibility.
2. **Repository Hosting:** Provide instructions to initialize a local Git repository and push the code to a new **GitHub** repository.
3. **Deployment Platform:** Connect the GitHub repo to **Vercel** for hosting the frontend and API.
4. **Database Provisioning:** Guide me in setting up a managed PostgreSQL database on **Neon.tech** or **Supabase**.
5. **Environment Configuration:** Securely configure `DATABASE_URL` and `JWT_SECRET` in the Vercel dashboard.
6. **Build Commands:** Add `npx prisma generate` to the build step to ensure the Prisma client is correctly generated on the server.

Please provide a step-by-step execution plan for these tasks."

---

## 🔑 Zaroori Variables (Aapko Yeh Chahiye)

Jab aap website live karenge, to aapko yeh values setup karni hongi:

| Variable Name | Description |
| :--- | :--- |
| `DATABASE_URL` | Aapka PostgreSQL connection link (Neon ya Supabase se milega) |
| `JWT_SECRET` | Ek bahut lamba aur random string (e.g., `8f7d9a1c...`) login ke liye |
| `NODE_ENV` | Isse `production` set karna hoga |

---

> [!TIP]
> Agar aap chahte hain ke main abhi iska **Step 1 (GitHub Setup)** shuru karoon, to bas mujhe bata dejiye!
