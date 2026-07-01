# Mise en ligne Mata Reva Booking

Objectif : obtenir un vrai lien web partageable pour que plusieurs utilisateurs puissent ouvrir la meme application et voir les memes reservations Supabase.

## Mode utilisateurs choisi

Mode equipe :

- tous les utilisateurs connectes voient toutes les reservations ;
- tous les utilisateurs connectes peuvent ajouter, modifier et supprimer les reservations ;
- les reservations sont stockees dans Supabase, pas seulement dans le navigateur.

Ce mode est defini dans `supabase-schema.sql` avec les regles RLS de la table `bookings`.

## 1. Lancer le schema dans Supabase

1. Ouvrir le projet Supabase.
2. Aller dans `SQL Editor`.
3. Copier tout le contenu de `supabase-schema.sql`.
4. Cliquer sur `Run`.

Cela cree la table `bookings` et les regles de securite.

## 2. Creer les utilisateurs

Option simple depuis l'application :

1. Ouvrir l'application.
2. Cliquer sur `Creer le compte`.
3. Saisir email + mot de passe.
4. Si Supabase demande une confirmation email, valider l'email.
5. Se connecter.

Option depuis Supabase :

1. Aller dans `Authentication`.
2. Ajouter les utilisateurs.
3. Leur communiquer email + mot de passe.

## 3. Publier avec un vrai lien

Le plus simple pour cette application statique est Netlify.

### Netlify

1. Aller sur Netlify.
2. Creer un nouveau site.
3. Choisir l'option de depot manuel ou drag-and-drop.
4. Envoyer le dossier complet `MATA REVA BOOKING`.
5. Netlify donnera un lien du type `https://nom-du-site.netlify.app`.

Fichiers a publier :

- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`
- `sw.js`
- `supabase-config.js`
- le dossier `assets`

Ne pas publier :

- aucune cle secrete ;
- aucune connection string Postgres ;
- aucune cle `service_role`.

## 4. Apres publication

1. Ouvrir le lien public.
2. Se connecter avec un utilisateur.
3. Ajouter une reservation test.
4. Ouvrir le meme lien sur un autre appareil.
5. Se connecter avec un autre utilisateur.
6. Verifier que la reservation test apparait.

## 5. Important

La cle presente dans `supabase-config.js` est une cle publique faite pour le navigateur.

La connection string Postgres ne doit jamais etre mise dans le code de l'application, car elle donnerait un acces direct a la base.
