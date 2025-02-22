# CopyReactJS

Small and simplified implementation of ReactJS

# Exploration Approfondie de React : Fiber, DOM Virtuel et Réconciliation

---

## 📝 **Résumé détaillé et complet**

### **🧩 Comprendre les fondamentaux de React**

- **React Elements** : Représentation d'un nœud de DOM ou d'un composant, créés par `React.createElement`. Les éléments sont des objets JavaScript avec des propriétés comme `type`, `props`, et éventuellement `key`.
- **Composants React** : Classes ou fonctions qui renvoient des arbres d'éléments. Les fonctions retournent directement les éléments, tandis que les classes utilisent la méthode `render`.
- **Instances de Composant** : Les instances des composants conservent un état (state) et les cycles de vie. Les fonctions Hooks comme `useState` ou `useEffect` permettent une gestion moderne et simplifiée de ces états.

---

### **🔄 La Réconciliation et le DOM Virtuel**

- **Virtual DOM** : Stockage en mémoire d'un arbre représentant l'interface utilisateur. Utilisé pour minimiser les modifications coûteuses sur le DOM réel.
- **Synchronisation** : À chaque mise à jour d’état ou de props, React génère un nouvel arbre virtuel et le compare à l’ancien à l’aide de l’algorithme de Diffing.
- **Algorithme de Diffing** :
    - Suppose que deux types d'éléments différents produisent deux arbres distincts.
    - Exploite des clés uniques dans les listes pour identifier les changements.
    - Opérations courantes :
        - Modification des propriétés si le type reste le même.
        - Création ou suppression d'éléments si le type diffère.

---

### **🧵 Fiber : Le Réconciliateur Moderne de React**

- **Contexte et Origine** :
    - Introduit dans React 16 pour remplacer l'ancien réconciliateur "Stack".
    - Permet un traitement asynchrone, essentiel pour des expériences fluides.
- **Phases du traitement** :
    - **Render (asynchrone)** :
        - Appelle les fonctions internes `beginWork` et `completeWork`.
        - Permet de prioriser, interrompre ou abandonner des tâches.
    - **Commit (synchrone)** :
        - Applique les changements au DOM réel ou appelle les méthodes du cycle de vie comme `componentDidMount`.
- **Structure de l'arbre Fiber** :
    - Chaque Fiber représente un nœud dans un arbre.
    - Propriétés clés :
        - `child` : Premier enfant du nœud.
        - `sibling` : Nœud frère.
        - `return` : Nœud parent.
        - `alternate` : Connexion entre l’arbre actuel et l’arbre en cours de modification (`workInProgress`).

---

### **📊 Gestion des Priorités et de la Performance**

- **Time Slicing** : Permet de découper les tâches longues en morceaux pour éviter le blocage de l’interface utilisateur.
- **Double Buffering** : Utilisé pour maintenir la cohérence de l’interface en travaillant sur un arbre temporaire avant de basculer au rendu final.
- **API utilisées** :
    - `requestAnimationFrame` : Planifie les animations à haute priorité.
    - `requestIdleCallback` : Exécute les tâches à faible priorité lorsque le système est inactif.

---

### **🌐 Intégration et Rendus Multi-Plateformes**

- **Renderers** :
    - **React DOM** : Pour le web.
    - **React Native** : Pour les applications mobiles.
    - Les rendus spécifiques sont délégués à ces bibliothèques.
- **Communication entre React et le renderer** :
    - Via des champs comme `updater` ou `dispatcher`, permettant à React de déléguer la gestion des états (`setState`, `useState`).

---

### **📚 Cas pratiques et Optimisations**

- **Gestion des Clés** :
    - Utilisation de clés uniques (non basées sur les index) pour minimiser les réinitialisations inutiles dans les listes.
- **Hooks** :
    - Modernisent l'accès au state et aux effets avec une approche fonctionnelle.
- **Applications de Fiber** :
    - **Error Boundaries** : Capture des erreurs sans interrompre tout l’arbre.
    - **Suspense et Concurrent Mode** : Facilite le rendu non bloquant.

- **2 arbres Fiber** : Le `current tree` (DOM actuel) et le `workInProgress tree` (modifications).
- **24 types de `tag`** définissant les relations entre Fibers et composants.
- **1 algorithme de Diffing** : Réduit les opérations nécessaires, bien en dessous de la taille de l'arbre.

### **🔍 Les fondations de React Hooks**

- **Définition** : Les Hooks permettent d'utiliser l'état (`state`) et les cycles de vie des composants sans écrire de classes.
- **Exemples principaux** : `useState` pour gérer l'état local et `useEffect` pour gérer les effets secondaires.
- **Règles fondamentales** :
    - **Ordre des appels** : Les Hooks ne peuvent pas être appelés dans des boucles ou des conditions pour maintenir un ordre constant.
    - **Tableau d'indexation** : L'état des Hooks est stocké dans un tableau basé sur des indices uniques.

---

### **🔄 Fonctionnement interne du Hook `useState`**

- **Implémentation simplifiée** :
    - Retourne un tableau avec deux éléments : une valeur d'état et une fonction de mise à jour.
    - Les états sont indexés dans un tableau global pour garantir leur persistance entre les rendus.
- **Gestion des multiples états** :
    - Un indice global (`index`) est utilisé pour localiser chaque état dans le tableau.
    - Chaque appel de `useState` incrémente cet indice pour s'assurer que chaque Hook utilise le bon emplacement.
- **Problème résolu** :
    - Si les Hooks étaient appelés dans des conditions ou des boucles, les indices seraient perturbés, entraînant des erreurs dans les associations état/index.

---

### **🌟 Fonctionnement interne du Hook `useEffect`**

- **Structure** :
    - Prend un callback et un tableau de dépendances en paramètres.
    - Appelle le callback uniquement lorsque les dépendances ont changé.
- **Stockage des dépendances** :
    - Les dépendances précédentes sont également stockées dans le tableau global utilisé par `useState`.
- **Comparaison des dépendances** :
    - Utilise `Object.is` pour détecter les changements entre l'état précédent et actuel des dépendances.
- **Résultat** :
    - Permet d’exécuter les effets uniquement quand cela est nécessaire, évitant ainsi des appels inutiles.

---

### **📈 Communication entre React et le Renderer**

- **Transfert via un Dispatcher** :
    - `useState` et `useEffect` sont appelés par un dispatcher global configuré par le renderer (par ex. React DOM).
    - Ce dispatcher relie les Hooks au système sous-jacent de React.
- **Interopérabilité** :
    - Les Hooks sont indépendants de la plateforme grâce à cette architecture flexible.

