<div align="center">

```
   ______ __  __ ___     _____ _____ ___    _   __
  / ____// / / //   |   / ___// ___//   |  / | / /
 / / __ / /_/ // /| |   \__ \ \__ \/ /| | /  |/ /
/ /_/ // __  // ___ |  ___/ /___/ / ___ |/ /|  /
\____//_/ /_//_/  |_| /____//____/_/  |_/_/ |_/

    > building for the web since 1999_
```

[![Typing](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=20&pause=1200&color=7C3AED&center=true&vCenter=true&width=560&lines=full-stack+dev+%2F+app+builder;web+%C2%B7+tooling+%C2%B7+AI+experiments;IT+%2B+networking+%2B+security+underneath;ship+it%2C+break+it%2C+patch+it%2C+repeat)](https://abomazen.com)

[![Site](https://img.shields.io/badge/abomazen.com-live-7C3AED?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://abomazen.com)
[![Instagram](https://img.shields.io/badge/@ghassan.shk-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/ghassan.shk)
[![Email](https://img.shields.io/badge/say_hi-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:ghasscc@gmail.com)

</div>

---

## `$ whoami`

```bash
ghassan@abomazen:~$ whoami --verbose

  name     : Ghassan Mazen
  role     : software / web / app developer
  origin   : IT · networking · security
  focus    : interfaces, tools, and the occasional cursed experiment
  motto    : learn by building, testing, and occasionally breaking things
  status   : open to build

ghassan@abomazen:~$ uptime
  since 1999 · load average: 3 side projects, 1 main quest
```

I started in cables, subnets, and packet captures — then discovered that the
thing I actually liked was *building the software on top of them*. Now I write
apps and web tooling, and the infra background just means I know what happens
after `npm run build`.

---

## `$ cat dev.ts`

```ts
interface Developer {
  readonly handle: '@ghassan.shk';
  stack: Stack;
  currently: string[];
  learning: string[];
  wontDo: 'ship it without testing it' | never;
}

const ghassan: Developer = {
  handle: '@ghassan.shk',
  stack: {
    frontend : ['JavaScript (ES modules)', 'HTML5', 'CSS3', 'Canvas', 'WebAudio'],
    backend  : ['Python', 'Node.js', 'Firebase', 'REST', 'SSE / streaming'],
    scripting: ['Bash', 'PowerShell'],
    ops      : ['Linux', 'Git', 'Windows Server', 'VMware', 'AWS', 'Azure'],
    net_sec  : ['Wireshark', 'Nmap', 'Burp Suite', 'Cisco', 'MikroTik'],
  },
  currently: ['LLM-powered apps', 'design systems from scratch', 'zero-dependency builds'],
  learning : ['TypeScript at depth', 'edge functions', 'systems design'],
  wontDo   : 'ship it without testing it',
};

export default ghassan; // PRs welcome
```

---

## `$ ls -la ~/stack`

| Layer | Tech |
| --- | --- |
| **Languages** | ![JS](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![Bash](https://img.shields.io/badge/Bash-4EAA25?style=flat-square&logo=gnubash&logoColor=white) ![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=flat-square&logo=powershell&logoColor=white) |
| **Frontend** | ![Vanilla](https://img.shields.io/badge/Vanilla_JS-no_framework-yellow?style=flat-square) ![Canvas](https://img.shields.io/badge/Canvas_API-000?style=flat-square&logo=html5&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) |
| **Backend / Data** | ![Node](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black) ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) |
| **AI / LLM** | ![OpenRouter](https://img.shields.io/badge/OpenRouter-6467F2?style=flat-square) ![Streaming](https://img.shields.io/badge/SSE_streaming-ff6f00?style=flat-square) ![Prompting](https://img.shields.io/badge/prompt_engineering-10a37f?style=flat-square) |
| **Ops & Infra** | ![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black) ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) ![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonaws&logoColor=white) ![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat-square&logo=microsoftazure&logoColor=white) |
| **Net & Sec** | ![Wireshark](https://img.shields.io/badge/Wireshark-1679A7?style=flat-square&logo=wireshark&logoColor=white) ![Nmap](https://img.shields.io/badge/Nmap-4682B4?style=flat-square) ![Burp](https://img.shields.io/badge/Burp_Suite-FF6633?style=flat-square&logo=burpsuite&logoColor=white) ![Cisco](https://img.shields.io/badge/Cisco-1BA0D7?style=flat-square&logo=cisco&logoColor=white) ![MikroTik](https://img.shields.io/badge/MikroTik-293239?style=flat-square&logo=mikrotik&logoColor=white) |

---

## `$ git log --oneline --graph`

```
* abomazen.com — the personal hub
|   Hand-built static site: modular ES modules, custom design system,
|   ⌘K command palette, canvas particle field, pixel-art studio with
|   undo/redo, Firebase-backed guestbook. Zero frameworks, zero CDN.
|   → https://abomazen.com
|
* /ai — the AI arcade
|   Streaming chat with 11 personas + an AI dungeon master that keeps
|   real state (HP, gold, inventory, turns) across refreshes. The model
|   returns strict JSON per turn; every field is clamped and validated,
|   so a malformed reply degrades to narration instead of a crash.
|   Locked to zero-cost models via live catalogue filtering + failover.
|   → https://abomazen.com/ai
|
* Automation scripts
|   Bash & PowerShell that delete the boring parts of IT work.
|
* Packet analysis labs
|   Captures, filters, and write-ups — knowing what the wire says
|   makes you a better debugger of everything above it.
|
* Network configs
|   Cisco & MikroTik: routing, VLANs, firewall rules, as code.
|
* Study notes & labs
    Network+ / Security+ material, structured and reusable.
```

---

## `$ top -o commits`

<div align="center">

![Stats](https://github-readme-stats.vercel.app/api?username=GhassanMazen00&show_icons=true&hide_border=true&theme=tokyonight&include_all_commits=true&count_private=true)
![Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=GhassanMazen00&layout=compact&hide_border=true&theme=tokyonight&langs_count=8)

![Streak](https://streak-stats.demolab.com?user=GhassanMazen00&theme=tokyonight&hide_border=true)

</div>

---

## `$ man ghassan`

```
PRINCIPLES(7)                 Developer Manual                 PRINCIPLES(7)

NAME
     ghassan — builds software, then reads the logs

DESCRIPTION
     Ship small, ship often. A dependency is a promise someone else
     has to keep, so prefer the platform. Read the spec before the
     Stack Overflow answer. If it isn't reproducible, it isn't fixed.
     Every abstraction leaks — know what's under yours.

EXIT STATUS
     0    it works, and you know why
     1    it works, and you don't          (this is a bug)

SEE ALSO
     abomazen.com(1), curiosity(3)
```

---

<div align="center">

```
[ system ] all services nominal · coffee.service: active (running)
```

*Always learning, always curious — now with better error handling.*

</div>
