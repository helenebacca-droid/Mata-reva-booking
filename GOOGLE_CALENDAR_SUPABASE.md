# Synchronisation Google Agenda - Mata Reva Booking

Ce guide sert a connecter les reservations Supabase a l'agenda Google partage.

## 1. Ajouter les colonnes dans Supabase

Dans Supabase, ouvrir **SQL Editor**, coller le contenu du fichier :

`supabase-calendar-columns.sql`

Puis cliquer sur **Run**.

Ces colonnes gardent le lien entre une reservation et son evenement Google Agenda.

## 2. Verifier l'agenda Google

Agenda utilise :

```text
c123c435325948330f775dce23e87b2267cd3cfb9f5cbe521dc13d22485da4f8@group.calendar.google.com
```

Dans Google Agenda, cet agenda doit etre partage avec le compte de service :

```text
mata-reva-calendar@mata-reva-booking.iam.gserviceaccount.com
```

Le droit doit etre :

```text
Make changes to events
```

## 3. Ajouter les secrets dans Supabase

Dans Supabase :

1. Aller dans **Edge Functions**
2. Aller dans **Secrets**
3. Ajouter ces secrets :

```text
GOOGLE_CALENDAR_ID
```

Valeur :

```text
c123c435325948330f775dce23e87b2267cd3cfb9f5cbe521dc13d22485da4f8@group.calendar.google.com
```

Puis ajouter :

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

Valeur : ouvrir le fichier JSON telecharge depuis Google Cloud et coller le contenu complet du fichier.

Important : ne pas coller seulement le nom `mata-reva-booking-99205d9f51d1`. Il faut le contenu complet du JSON, qui commence normalement par :

```json
{
  "type": "service_account",
  "project_id": ...
}
```

Ne jamais mettre ce JSON dans GitHub, dans `app.js`, dans `www`, ni dans l'APK.

## 4. Creer la fonction Edge Supabase

Dans Supabase, creer/deployer une fonction appelee exactement :

```text
sync-google-calendar
```

Le code local est ici :

```text
supabase/functions/sync-google-calendar/index.ts
```

Cette fonction :

- cree un evenement Google quand une reservation est ajoutee ;
- met a jour l'evenement Google quand la reservation est modifiee ;
- supprime l'evenement Google quand la reservation est supprimee ;
- renvoie l'identifiant Google dans `google_event_id`.

## 5. Publier l'application mise a jour

Apres avoir mis la fonction et les secrets dans Supabase :

1. Mettre a jour les fichiers du site sur GitHub Pages.
2. Recharger l'application.
3. Creer une reservation test.
4. Verifier dans Supabase que `google_event_id` se remplit.
5. Verifier dans Google Agenda que l'evenement apparait.

Si `google_sync_error` contient un message, la reservation est bien gardee dans Supabase, mais Google Agenda a refuse la synchronisation.
