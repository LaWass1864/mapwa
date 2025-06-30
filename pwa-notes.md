
<!-- Choisir un icone 1024*1024 -->
Nommer ce fichier : logo.png et le déposer dans assets/
Exemple de site : https://www.svgrepo.com/

<!-- Parametrage des icones -->
voir site : https://web.dev/learn/pwa/web-app-manifest?hl=fr

![alt text](image.png)

![alt text](image-1.png)

<!-- Lancer la commande dans le terminal de votre IDE en BASH  pour generer des icones-->
nox

Cette commande va generer des icones dans le dossier assets/
Mettre à jour le fichier manifest.json (section icons) + fichier index.html (liens favicon, apple-touch-icon ect)

<!-- Commande a connaitre si on veut nettoyer le dossier assets/-->

Supprime tout le contenu de assets/ sans supprimer le dossier lui-même (Mac/linux/Git Bash) : rm -rf ./assets/*

Sur Windows Powershell : Remove-Item .\assets\* -Recurse -Force

<!-- Convertisseur en ligne -->
https://www.svg2png.com/

https://convertio.co/fr/svg-png/

https://cloudconvert.com/svg-to-png

Tu peux spécifier la résolution 1024x1024 selon les outils

<!-- Commandes github -->
<!-- Creer une branche --> $ git remote add [name_of_your_remote] [name_of_your_new_branch]
<!-- creation d'un dossier assets a la racine du projet --> mkdir assets 

http://10.0.2.2:3000