# Carspotting

Minimalistisk webapp för att jaga registreringsplåtar i följd (001, 002, 003…) tillsammans med kompisar. Invite-only, med stöd för att hantera en "fake"-användare (t.ex. en förälder) vid sidan av ditt eget konto.

## Setup (första gången — ca 15 min)

### 1. Supabase (databas + inloggning)

1. Gå till [supabase.com](https://supabase.com) → **Start your project** (logga in med GitHub)
2. **New project**
   - Name: `carspotting`
   - Database password: välj något och spara det (behövs inte senare)
   - Region: välj närmaste (Stockholm / Frankfurt)
   - Klicka **Create new project** — tar ~2 min
3. När projektet är klart: öppna **SQL Editor** i vänstermenyn
   - Klicka **New query**
   - Öppna filen `supabase/schema.sql` i det här repot och klistra in hela innehållet
   - Klicka **Run** (eller ⌘/Ctrl+Enter)
4. Stäng av öppen registrering:
   - **Authentication → Providers → Email**
   - Slå AV **Enable Signup** (viktigt! Annars kan vem som helst registrera sig)
   - Slå PÅ **Magic Link**
   - Spara
5. Hämta dina API-nycklar:
   - **Project Settings → API**
   - Kopiera **Project URL** och **anon public**-nyckeln

### 2. Kör lokalt (valfritt, men bra för att testa)

```bash
cd carspotting
cp .env.local.example .env.local
# Öppna .env.local och klistra in dina Supabase-värden
npm run dev
```

Öppna http://localhost:3000

### 3. Bjud in första användaren (dig själv)

1. I Supabase: **Authentication → Users → Invite user**
2. Ange din e-post → **Send invitation**
3. Kolla mailen, klicka på länken — du landar i appen och får välja visningsnamn

### 4. Deploya till Vercel (produktion)

1. Pusha koden till GitHub (skapa ett repo och `git push`)
2. Gå till [vercel.com](https://vercel.com) → **Add New Project** → importera ditt GitHub-repo
3. I **Environment Variables**, lägg till:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klicka **Deploy**
5. Gå tillbaka till Supabase → **Authentication → URL Configuration**
   - Sätt **Site URL** till din Vercel-domän (t.ex. `https://carspotting.vercel.app`)
   - Lägg till samma URL i **Redirect URLs**

### 5. Bjud in kompisar

Supabase → **Authentication → Users → Invite user** → ange deras e-post.

## Funktioner

- **Hem**: visar ditt senaste fynd (+ ev. fake-spelare du hanterar) och en stor knapp för att registrera nästa nummer i sekvens.
- **Topplista**: alla spelare sorterade efter högsta fynd. Ditt konto markeras vitt.
- **Hantera**: skapa/ta bort fake-spelare som du registrerar fynd åt.
- **Ångra**: ta bort senaste fyndet om du råkat klicka fel.

## Regler (enforced i databasen)

- Du måste hitta nummer N innan du kan registrera N+1.
- Bara senaste fyndet kan ångras.
- Bara du (och admin via Supabase-panelen) kan se/ändra dina fake-spelare.
- Fake-spelare ser ut som riktiga för andra på topplistan.

## Tech

- Next.js 16 (App Router, Turbopack)
- Supabase (Postgres + Auth)
- Tailwind CSS 4
- Deployas på Vercel
