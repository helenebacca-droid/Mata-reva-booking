# Generer l'APK Android Mata Reva Booking

Le projet Android est pret dans le dossier :

`android`

L'application conserve le meme design, le meme fonctionnement et la meme connexion Supabase que la version web.

## Ouvrir dans Android Studio

1. Ouvrir Android Studio.
2. Cliquer sur `Open`.
3. Selectionner le dossier :
   `C:\Users\helen\OneDrive\Documents\MATA REVA BOOKING\android`
4. Attendre que la synchronisation Gradle se termine.

## Tester sur telephone

1. Brancher le telephone Android en USB.
2. Activer le mode developpeur et le debogage USB sur le telephone.
3. Dans Android Studio, choisir le telephone dans la liste des appareils.
4. Cliquer sur le bouton `Run`.

## Generer un APK de test

Dans Android Studio :

1. Menu `Build`.
2. `Build Bundle(s) / APK(s)`.
3. `Build APK(s)`.
4. Attendre la fin de la compilation.
5. Cliquer sur `locate` quand Android Studio propose d'ouvrir le fichier.

Le fichier sera normalement ici :

`android\app\build\outputs\apk\debug\app-debug.apk`

Cet APK debug permet d'installer et tester l'application sur un telephone.

## Generer une version distribuable

Pour envoyer l'application a d'autres personnes ou la publier :

1. Menu `Build`.
2. `Generate Signed Bundle / APK`.
3. Choisir `APK` ou `Android App Bundle`.
4. Creer une cle de signature si Android Studio le demande.
5. Generer la version signee.

## Apres modification de l'application web

Si `index.html`, `app.js`, `styles.css`, `sw.js` ou les images changent :

1. Lancer le script :
   `scripts\sync-web.ps1`
2. Ouvrir Android Studio.
3. Relancer `Build APK(s)`.

Ce script recopie la version web dans le projet Android puis synchronise Capacitor.
