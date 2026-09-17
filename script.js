// Mobile nav toggle — the only interactive behavior this page needs
// beyond native <details> for the FAQ accordion, and the chat demo below.
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  initChatDemo();
});

/**
 * Interactive hero chat demo.
 *
 * This is a scripted, client-side-only preview of MindCare AI's
 * conversational *tone* — it does not call any real AI, and it does not
 * store or transmit anything typed here. That's stated plainly in the
 * small caption under the input.
 *
 * Because this widget lives on a real mental-health product's marketing
 * page, it includes a basic keyword check for crisis-related language.
 * A scripted demo has no business improvising a response to something
 * like that — so once it's seen anything matching, every reply for the
 * rest of the session becomes the same fixed, honest redirect to real
 * help, rather than risking a glib canned line landing at the wrong
 * moment. This is deliberately conservative and deliberately dumb: a
 * simple substring match, not a classifier — the real product's actual
 * risk layer (described earlier on this page) is what that job belongs
 * to, not a homepage widget.
 *
 * It also recognizes ordinary exam/study stress language and offers a
 * short breathing exercise — a small, honest demonstration of the
 * "grounded coping guidance" the product claims to provide, rather than
 * leaving every non-crisis reply generic.
 */
function initChatDemo() {
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');
  var body = document.getElementById('chatBody');

  if (!form || !input || !body) return;

  // The chat body is prefilled (see index.html) with a short sample
  // conversation ending on the stress-exercise offer, so a first-time
  // visitor sees a realistic demonstration immediately rather than an
  // empty chat. State starts here matching where that transcript leaves
  // off — awaitingExerciseConsent is true because the last bubble shown
  // is the exercise offer, so if the visitor's first real message is
  // "yes," they get the actual exercise steps rather than a mismatched
  // reply. firstReplySent/introduced are true because the prefilled
  // transcript already covers the introduction.
  var crisisTriggered = false;
  var awaitingExerciseConsent = true;

  var crisisTerms = [
    'suicide', 'kill myself', 'killing myself', 'end my life', 'ending my life',
    'want to die', 'wanna die', 'no reason to live', 'hurt myself', 'hurting myself',
    'self harm', 'self-harm', 'end it all', 'not worth living'
  ];

  var crisisReply = "This sounds serious. If you're in immediate danger, please contact your " +
    "local emergency services or go to your nearest ER right now. This preview can't do more — " +
    "the real MindCare AI would connect you with a trained human immediately.";

  var stressTerms = [
    'exam', 'exams', 'test', 'tests', 'studying', 'study', 'finals',
    'stressed', 'stress', 'anxious', 'anxiety', 'overwhelmed', 'panic', 'nervous', 'pressure'
  ];

  var stressReply = "Exam pressure can feel heavy. Want to try a quick 90-second breathing exercise?";

  var exerciseSteps = "Breathe in for 4 counts, hold for 4, out for 6. Repeat three times, at your own pace. " +
    "Ready to talk about what's worrying you most?";

  var declineExerciseReply = "No pressure at all. Want to talk through what's making the exam feel heavy, " +
    "or just sit with it for a moment?";

  var affirmTerms = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please', 'lets do it', "let's do it", 'go for it', 'alright'];
  var declineTerms = ['no', 'nah', 'not now', 'later', 'skip', 'not really'];

  // Greetings get their own honest reply instead of falling into the
  // general supportive pool — "hello" answered with "that sounds heavy to
  // carry" reads as broken, not empathetic, so it's handled as its own
  // small conversational case rather than left to a keyword miss. The
  // very first greeting also introduces what MindCare AI actually is,
  // since a first-time visitor typing "hello" shouldn't be met with a
  // generic supportive line before they even know what they're talking to.
  var greetingSet = ['hi', 'hii', 'hiya', 'hello', 'hey', 'heya', 'yo', 'hlo',
    'good morning', 'good afternoon', 'good evening'];

  var introduced = true;
  var firstReplySent = true;

  var introReply = "Hi! I'm MindCare AI — your mental wellness companion, here for supportive " +
    "conversation and coping guidance. What's on your mind today?";

  function makePicker(pool) {
    var last = -1;
    return function () {
      var i;
      do { i = Math.floor(Math.random() * pool.length); }
      while (i === last && pool.length > 1);
      last = i;
      return pool[i];
    };
  }

  var nextGeneric = makePicker([
    "That makes sense. What's making it feel heaviest right now?",
    "Thanks for sharing that. Want to try a grounding exercise, or just talk it through?",
    "Pls feel free to discuss",
    "That's a lot to hold. You don't need it figured out — I'm just here.",
    "I'm glad you told me. Vent, try a coping technique, or just have company — your call."
  ]);

  var nextGreeting = makePicker([
    "Hey! What's going on today?",
    "Hi there. I'm listening whenever you're ready.",
    "Hello! How's today treating you?"
  ]);

  function containsAny(text, terms) {
    var lower = text.toLowerCase();
    return terms.some(function (term) { return lower.indexOf(term) !== -1; });
  }

  function isPureGreeting(text) {
    var cleaned = text.trim().toLowerCase().replace(/[!.?]+$/, '');
    return greetingSet.indexOf(cleaned) !== -1;
  }

  function decideReply(text) {
    var isFirstMessage = !firstReplySent;
    firstReplySent = true;

    if (crisisTriggered || containsAny(text, crisisTerms)) {
      crisisTriggered = true;
      awaitingExerciseConsent = false;
      return crisisReply;
    }

    if (awaitingExerciseConsent) {
      awaitingExerciseConsent = false;
      if (containsAny(text, affirmTerms)) return exerciseSteps;
      if (containsAny(text, declineTerms)) return declineExerciseReply;
      // Unclear reply — fall through to the normal checks below.
    }

    if (containsAny(text, stressTerms)) {
      awaitingExerciseConsent = true;
      return stressReply;
    }

    if (isPureGreeting(text)) {
      if (isFirstMessage) {
        introduced = true;
        return introReply;
      }
      return nextGreeting();
    }

    return nextGeneric();
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addBubble(text, who) {
    var div = document.createElement('div');
    div.className = 'bubble ' + who;
    div.textContent = text;
    body.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTypingThenReply(replyText) {
    var typing = document.createElement('div');
    typing.className = 'bubble them typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    scrollToBottom();

    var delay = 700 + Math.random() * 500;
    setTimeout(function () {
      typing.remove();
      addBubble(replyText, 'them');
    }, delay);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;

    addBubble(text, 'me');
    input.value = '';

    showTypingThenReply(decideReply(text));
  });

  // Show the end of the prefilled sample conversation (the exercise
  // offer) rather than its start, so the demo doesn't open scrolled to
  // the very first "Hi" bubble.
  scrollToBottom();
}
