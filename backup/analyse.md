Problème dans le code js : 
- **modes autre que tactile non fonctionnels :** pour le gyroscope on a que le `const alpha = e.alpha` qui n'utilise que l'axe `Z` de gyroscope (non fonctionnel égalmeent). 
Il faudra aussi inclure le mode radio qui connecte la manette RC (projet fab).
- **Saturation réseau :** on a parfois de la latence entre le téléphone et la voiture. Cela est très probablement causé à cause de ça : `await fetch('/volant?angle=${angle}');`  
qui demande une connexion à l'ESP 32. Il faudrait essayer de garder en permanence cette connexion plutot que de la refaireà chaque fois (voir les possibilitées et les inconvénients)


# Comparer les codes de [code_backup](./code_backup) avec les autres
