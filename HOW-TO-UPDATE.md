# How to update your website (no coding needed)

Everything you see on the website comes from a few **plain text files** in the `content` folder.
You change the text, save, and the website updates itself within about a minute.

| What you want to change | File to edit |
|---|---|
| Name, job title, intro, email, LinkedIn, YouTube, photo, "Open to opportunities" badge | `content/profile.txt` |
| "Latest updates" box (news, new job, paper, award…) | `content/news.txt` |
| Work experience | `content/experience.txt` |
| Projects | `content/projects.txt` |
| Skills | `content/skills.txt` |
| Education, certificates, languages | `content/education.txt` |
| CV download | replace `assets/CV.pdf` |
| GitHub activity | **nothing to do**, it updates automatically from your GitHub account |

---

## Editing a file on github.com (the easy way)

1. Open your repository on **github.com** and click the **`content`** folder.
2. Click the file you want to change, for example `projects.txt`.
3. Click the **pencil icon ✏️** (top right of the file) to edit.
4. Make your change.
5. Click the green **Commit changes…** button, then **Commit changes** again.
6. Wait about 1 minute and refresh your website. (If you don't see the change, press `Ctrl + Shift + R` or `Cmd + Shift + R`.)

You can do this from your phone too, using a browser.

---

## The 5 simple rules

1. **Keep the labels.** Each line starts with a label like `Title:` or `Date:`. Only change the text *after* the colon.
2. **Separate entries with `---`** (three dashes alone on a line).
3. **Bullet points start with `- `** (a dash and a space).
4. **Bold text:** wrap words in double stars, like `**PyTorch**`.
5. **Lines starting with `#` are notes for you.** They never appear on the website.

Links: write `[link text](https://example.com)`, or just paste the full `https://…` address.

If you make a mistake, the website does not break. At worst one entry looks odd until you fix it.
To undo a change, open the file on GitHub, click **History**, and copy back the old text.

---

## Copy-paste templates

**New project** (paste it at the top of `content/projects.txt`, under the `#` lines):

```
Title: My New Project
Where: Personal Project
Date: 11/2026
Link: https://github.com/shreekcode/my-new-project
Tags: Python, PyTorch, LLM
- What you built, in one sentence with **important words** in bold.
- The result or impact.
---
```

Add `Featured: yes` to make a project wide and highlighted.

**New job** (paste it at the top of `content/experience.txt`):

```
Title: Machine Learning Engineer
Company: Company Name
Date: 01/2027 – Present
Tags: Python, AWS, MLOps
- What you do there.
- Another achievement.
---
```

**News item** (paste it at the top of `content/news.txt`). Use the date format `YYYY-MM-DD`:

```
Date: 2026-11-15
Title: Gave a talk on RAG systems
Text: A short sentence about it.
---
```

**Skill group** (`content/skills.txt`): separate items with commas.

```
Group: Cloud
Items: AWS, GCP, Kubernetes
---
```

**Certificate or language** (`content/education.txt`): `Type:` is `education`, `certification` or `language`.

```
Type: certification
Title: AWS Certified Machine Learning
Where: Amazon Web Services
---
```

---

## Adding your photo

1. Open the `assets` folder on GitHub → **Add file → Upload files** → choose your picture (for example `photo.jpg`) → **Commit changes**.
2. In `content/profile.txt` set: `Photo: assets/photo.jpg`

## Updating your CV

Open the `assets` folder → **Add file → Upload files** → upload your new file named exactly **`CV.pdf`** → **Commit changes**. It replaces the old one.

## Adding LinkedIn

In `content/profile.txt`, paste your full LinkedIn link after `LinkedIn:`, for example
`LinkedIn: https://www.linkedin.com/in/your-name`. Leave it empty to hide the button.

---

## First-time publishing on GitHub Pages (only once)

1. On github.com create a **new repository** named exactly **`shreekcode.github.io`** (public).
   *(Any other name also works, but then the address becomes `shreekcode.github.io/<repo-name>`.)*
2. Upload all files from this folder (`index.html`, `.nojekyll`, the `assets` and `content` folders, this guide).
   On the repository page: **Add file → Upload files**, drag everything in, **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After 1–2 minutes your site is live at **https://shreekcode.github.io**

## Previewing on your own computer (optional)

Opening `index.html` by double-clicking does not work, because browsers block reading the text files from disk.
Instead, open a terminal in this folder, run `python3 -m http.server`, and visit http://localhost:8000
