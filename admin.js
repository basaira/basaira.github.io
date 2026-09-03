
    import { firebaseConfig, FIREBASE_PROJECT_ID } from "./firebase-config.js";
    import contentRegistryData from "./content-registry.js";
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

    import {
      initializeFirestore,
      collection,
      getDocs,
      getDoc,
      doc,
      serverTimestamp,
      writeBatch,
      query,
      orderBy,
      limit
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    import {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      signInWithRedirect,
      getRedirectResult,
      signInWithEmailAndPassword,
      setPersistence,
      browserLocalPersistence,
      signOut,
      onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, { experimentalForceLongPolling: true });
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    const AUTH_REDIRECT_FLAG = "basair_admin_auth_redirect_pending";

    const publicRef = doc(db, "site_content", "public");

    let currentUser = null;
    let isAdmin = false;
    let contentCache = { texts: {}, videos: [] };
    let requestsCache = [];
    let contentRegistry = [];
    let registryById = new Map();
    let auditCache = [];

    const $ = (id) => document.getElementById(id);

    function showStatus(message, type = "success") {
      const box = $("status");
      const text = String(message || "");
      box.className = "status" + (text ? " show " + type : "");
      box.dataset.statusType = text ? type : "";
      box.setAttribute("role", type === "error" ? "alert" : "status");
      box.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
      box.replaceChildren();
      if (!text) return;

      const mark = document.createElement("span");
      mark.className = "status-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = type === "success" ? "✓" : type === "error" ? "!" : "•";

      const copy = document.createElement("span");
      copy.className = "status-copy";
      copy.textContent = text;
      box.append(mark, copy);
    }

    function flashButtonLabel(button, message, duration = 1400) {
      if (!button) return;
      const original = button.dataset.delightOriginal || button.textContent;
      button.dataset.delightOriginal = original;
      button.textContent = message;
      button.classList.add("is-confirmed");
      window.clearTimeout(Number(button.dataset.delightTimer || 0));
      const timer = window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("is-confirmed");
        delete button.dataset.delightTimer;
      }, duration);
      button.dataset.delightTimer = String(timer);
    }

    function fmtDate(value) {
      if (!value) return "—";

      try {
        const d = value.toDate ? value.toDate() : new Date(value);
        return new Intl.DateTimeFormat("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(d);
      } catch (_) {
        return "—";
      }
    }

    function statusLabel(status) {
      return ({
        new: "جديد",
        contacted: "تم التواصل",
        pending: "مؤجل",
        accepted: "مقبول",
        rejected: "مرفوض"
      })[status] || status || "جديد";
    }

 function guessLang(id) {  
  const match = String(id).match(/(?:^|-)(ar|en|fr|ru|uz)(?:-|$)/i);
  return match ? match[1].toLowerCase() : "";
  }  


    const SECTION_LABELS = Object.freeze({
      global: "عام", navbar: "شريط التنقل", home: "الواجهة الرئيسية",
      "quick-guide": "الدليل المختصر", contact: "التقييم الأكاديمي", about: "عن الأكاديمية",
      tracks: "الدليل والمسارات الأكاديمية", "video-library": "المكتبة المرئية",
      testimonials: "آراء الطلاب", faq: "الأسئلة الشائعة", footer: "التذييل"
    });


    const PAGE_LABELS = Object.freeze({
      "index.html": "الموقع الرئيسي",
      "en/index.html": "EN · بوابة المسارات",
      "en/quran-kids/index.html": "EN · قرآن للأطفال",
      "en/quran-adults/index.html": "EN · قرآن للكبار",
      "en/arabic/index.html": "EN · العربية",
      "ru/index.html": "RU · بوابة المسارات",
      "ru/quran/index.html": "RU · القرآن",
      "ru/arabic/index.html": "RU · العربية",
      "uz/index.html": "UZ · بوابة المسارات",
      "uz/quran/index.html": "UZ · القرآن",
      "uz/arabic/index.html": "UZ · العربية"
    });
    function pageLabel(page) { return PAGE_LABELS[page] || page || "الموقع الرئيسي"; }

    function sectionLabel(section) {
      return SECTION_LABELS[section] || section || "عام";
    }

    function currentRegistryItem(id) {
      return registryById.get(id) || null;
    }

    function getEffectiveText(item) {
      if (!item) return "";
      return Object.prototype.hasOwnProperty.call(contentCache.texts || {}, item.id)
        ? String(contentCache.texts[item.id] || "")
        : String(item.text || "");
    }

    function hasOverride(id) {
      return Object.prototype.hasOwnProperty.call(contentCache.texts || {}, id);
    }

    async function loadContentRegistry() {
      const items = contentRegistryData && Array.isArray(contentRegistryData.items) ? contentRegistryData.items : [];
      contentRegistry = items.filter((item) => item && typeof item.id === "string" && item.id);
      registryById = new Map(contentRegistry.map((item) => [item.id, item]));
      refreshPageFilter();
      refreshSectionFilter();
      renderStats();
      renderTexts();
      return contentRegistry;
    }

    function refreshPageFilter() {
      const select = $("text-page-filter");
      if (!select) return;
      const current = select.value || "all";
      const pages = Array.from(new Set(contentRegistry.map((item) => item.page || "index.html"))).sort();
      select.textContent = "";
      const all = document.createElement("option"); all.value = "all"; all.textContent = "كل الصفحات"; select.appendChild(all);
      pages.forEach((page) => { const option = document.createElement("option"); option.value = page; option.textContent = pageLabel(page); select.appendChild(option); });
      select.value = pages.includes(current) ? current : "all";
    }

    function refreshSectionFilter() {
      const select = $("text-section-filter");
      if (!select) return;
      const current = select.value || "all";
      const sections = Array.from(new Set(contentRegistry.map((item) => item.section || "global"))).sort();
      select.textContent = "";
      const all = document.createElement("option");
      all.value = "all"; all.textContent = "كل الأقسام"; select.appendChild(all);
      sections.forEach((section) => {
        const option = document.createElement("option");
        option.value = section; option.textContent = sectionLabel(section); select.appendChild(option);
      });
      select.value = sections.includes(current) ? current : "all";
    }

    function newAuditRef() {
      return doc(collection(db, "admin_audit"));
    }

    function appendAuditToBatch(batch, action, targetType, targetId, details) {
      if (!currentUser || !isAdmin) return;
      batch.set(newAuditRef(), {
        action: String(action || "unknown").slice(0, 80),
        targetType: String(targetType || "unknown").slice(0, 40),
        targetId: String(targetId || "").slice(0, 160),
        details: details && typeof details === "object" ? details : {},
        actorUid: currentUser.uid,
        actorEmail: String(currentUser.email || "").slice(0, 160),
        createdAt: serverTimestamp()
      });
    }

    function normalizeContent(data) {
      const rawTexts = data && data.texts && typeof data.texts === "object" && !Array.isArray(data.texts) ? data.texts : {};
      const texts = {}; Object.entries(rawTexts).slice(0,5000).forEach(([id,value])=>{ if(typeof id==="string"&&id.length<=160&&typeof value==="string") texts[id]=value.slice(0,12000); });
      const rawVideos = Array.isArray(data && data.videos) ? data.videos : [];
      const videos = rawVideos.slice(0,250).filter(v=>v&&typeof v==="object").map(v=>({title:String(v.title||"").slice(0,120),category:String(v.category||"all").slice(0,40),videoUrl:String(v.videoUrl||"").slice(0,2048),posterUrl:String(v.posterUrl||v.imageUrl||"").slice(0,2048),published:v.published!==false,createdAt:String(v.createdAt||"").slice(0,64),updatedAt:String(v.updatedAt||"").slice(0,64)}));
      const rawSettings = data && data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) ? data.settings : {};
      const settings = {whatsappNumber:String(rawSettings.whatsappNumber||"").replace(/\D/g,"").slice(0,15),telegramUsername:String(rawSettings.telegramUsername||"").trim().replace(/^@+/,"").slice(0,32),updatedAt:String(rawSettings.updatedAt||"").slice(0,64)};
      return {texts,videos,settings};
    }

    let activeAdminTabTransition = null;

    function canUseAdminViewTransitions() {
      return typeof document.startViewTransition === "function" &&
        !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function applyTabState(tab) {
      document.querySelectorAll(".nav-btn").forEach((btn) => {
        const selected = btn.dataset.tab === tab;
        btn.classList.toggle("active", selected);
        btn.setAttribute("aria-selected", selected ? "true" : "false");
        btn.tabIndex = selected ? 0 : -1;
      });

      document.querySelectorAll(".section").forEach((sec) => {
        const selected = sec.id === "tab-" + tab;
        sec.classList.toggle("active", selected);
        sec.setAttribute("aria-hidden", selected ? "false" : "true");
      });
    }

    function setTab(tab) {
      const target = $("tab-" + tab);
      if (!target) return;

      const current = document.querySelector(".section.active");
      if (current === target) {
        applyTabState(tab);
        return;
      }

      if (!canUseAdminViewTransitions()) {
        applyTabState(tab);
        return;
      }

      if (activeAdminTabTransition && typeof activeAdminTabTransition.skipTransition === "function") {
        activeAdminTabTransition.skipTransition();
      }

      if (current instanceof HTMLElement) current.style.viewTransitionName = "basair-admin-panel";
      document.documentElement.classList.add("basair-admin-tab-transition");

      const transition = document.startViewTransition(() => {
        if (current instanceof HTMLElement) current.style.viewTransitionName = "none";
        applyTabState(tab);
        target.style.viewTransitionName = "basair-admin-panel";
      });
      activeAdminTabTransition = transition;

      transition.finished.finally(() => {
        if (current instanceof HTMLElement) current.style.viewTransitionName = "";
        target.style.viewTransitionName = "";
        if (activeAdminTabTransition === transition) activeAdminTabTransition = null;
        document.documentElement.classList.remove("basair-admin-tab-transition");
      });
    }

    function initAdminTabSemantics() {
      const tabs = Array.from(document.querySelectorAll(".nav-btn[data-tab]"));
      if (!tabs.length) return;
      const tabList = tabs[0].parentElement;
      if (tabList) tabList.setAttribute("role", "tablist");

      tabs.forEach((btn, index) => {
        const tab = btn.dataset.tab || "overview";
        const panel = $("tab-" + tab);
        const buttonId = "admin-tab-" + tab;
        btn.id = buttonId;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", "tab-" + tab);
        if (panel) {
          panel.setAttribute("role", "tabpanel");
          panel.setAttribute("aria-labelledby", buttonId);
        }

        btn.addEventListener("keydown", (event) => {
          let nextIndex = null;
          if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
          else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = tabs.length - 1;
          if (nextIndex === null) return;
          event.preventDefault();
          const next = tabs[nextIndex];
          setTab(next.dataset.tab);
          next.focus({ preventScroll: true });
        });
      });

      const active = tabs.find((btn) => btn.classList.contains("active")) || tabs[0];
      applyTabState(active.dataset.tab || "overview");
    }

    initAdminTabSemantics();

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });

    document.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.jump));
    });

    async function checkAdminRole(user) {
      if (!user) return false;

      const roleSnap = await getDoc(doc(db, "admin_roles", user.uid));
      return roleSnap.exists() && roleSnap.data().active === true;
    }

    function renderAuth() {
      const login = $("login-screen");
      const dashboard = $("admin-dashboard");
      const logout = $("logout-btn");
      const uidHelp = $("uid-help");
      const uidBox = $("uid-box");
      const line = $("auth-line");

      if (!currentUser) {
        login.classList.remove("hidden");
        dashboard.classList.add("hidden");
        logout.classList.add("hidden");
        uidHelp.classList.add("hidden");
        line.textContent = "سجّل الدخول للمتابعة";
        return;
      }

      line.textContent = currentUser.email || currentUser.uid;
      logout.classList.remove("hidden");

      if (!isAdmin) {
        login.classList.remove("hidden");
        dashboard.classList.add("hidden");
        uidHelp.classList.remove("hidden");
        uidBox.textContent = currentUser.uid;
        showStatus("هذا الحساب دخل بنجاح، لكنه ليس مديرًا بعد.", "warning");
        return;
      }

      login.classList.add("hidden");
      dashboard.classList.remove("hidden");
      uidHelp.classList.add("hidden");
    }

    async function loadAll() {
      if (!isAdmin) return;

      showStatus("جار تحديث البيانات...", "warning");
      try { await loadContentRegistry(); }
      catch (error) { console.error("Content registry load failed:", error); }
      const results = await Promise.allSettled([loadContent(), loadRequests(), loadAudit()]);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) {
        console.error("Admin data load errors:", failed.map((r) => r.reason));
        const first = failed[0].reason;
        const code = first && first.code ? first.code : "";
        if (code === "permission-denied") {
          showStatus("تم تسجيل الدخول، لكن Firestore رفض قراءة بيانات الإدارة. انشر firestore.rules الموجودة في المشروع وتأكد أن admin_roles/UID يحتوي active: true.", "error");
        } else {
          showStatus("تعذر تحميل جزء من بيانات الإدارة. راجع اتصال Firebase ثم أعد المحاولة.", "error");
        }
        return;
      }
      showStatus("تم تحديث البيانات بنجاح.", "success");
    }

    async function loadContent() {
      const snap = await getDoc(publicRef);
      contentCache = normalizeContent(snap.exists() ? snap.data() : {});
      renderStats();
      renderTexts();
      renderVideos();
      renderContactSettings();
    }

    async function loadRequests() {
      const [legacyResult, assessmentResult] = await Promise.allSettled([
        getDocs(query(collection(db, "enrollment_requests"), limit(1000))),
        getDocs(query(collection(db, "assessment_requests"), limit(1000)))
      ]);

      const normalizeRequest = (d, sourceCollection) => {
        const data = d.data() || {};
        return {
          id: d.id,
          sourceCollection,
          ...data,
          phone: data.phone || data.whatsapp || data.email || "",
          message: data.message || data.goal || "",
          submissionDate: data.submissionDate || data.submittedAt || null
        };
      };

      const legacyDocs = legacyResult.status === "fulfilled" ? legacyResult.value.docs : [];
      const assessmentDocs = assessmentResult.status === "fulfilled" ? assessmentResult.value.docs : [];
      requestsCache = [
        ...legacyDocs.map((d) => normalizeRequest(d, "enrollment_requests")),
        ...assessmentDocs.map((d) => normalizeRequest(d, "assessment_requests"))
      ];

      requestsCache.sort((a, b) => {
        const ad = a.submissionDate && a.submissionDate.toMillis ? a.submissionDate.toMillis() : 0;
        const bd = b.submissionDate && b.submissionDate.toMillis ? b.submissionDate.toMillis() : 0;
        return bd - ad;
      });

      renderStats();
      renderRequests();

      const failures = [
        legacyResult.status === "rejected" ? "enrollment_requests" : "",
        assessmentResult.status === "rejected" ? "assessment_requests" : ""
      ].filter(Boolean);
      if (failures.length === 2) {
        const err = assessmentResult.reason || legacyResult.reason || new Error("تعذر قراءة الطلبات");
        throw err;
      }
      if (failures.length) {
        showStatus(`تم تحميل الطلبات المتاحة، لكن تعذرت قراءة: ${failures.join("، ")}. انشر firestore.rules الجديدة على Firebase.`, "warning");
      }
      if (!failures.length && (legacyDocs.length >= 1000 || assessmentDocs.length >= 1000)) showStatus("تم تحميل حد الأمان البالغ 1000 طلب من إحدى المجموعات. للسجل الأكبر يلزم تقسيم صفحات بدل تحميل كل السجل دفعة واحدة.", "warning");
    }

    async function loadAudit() {
      try {
        const snap = await getDocs(query(collection(db, "admin_audit"), orderBy("createdAt", "desc"), limit(100)));
        auditCache = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      } catch (error) {
        auditCache = [];
        if (error && error.code !== "permission-denied") console.error("Audit load failed:", error);
      }
      renderAudit();
      renderStats();
    }

    function auditActionLabel(action) {
      return ({
        "text.update": "تعديل نص", "text.restore": "استعادة نص أصلي",
        "video.create": "إضافة فيديو", "video.update": "تعديل فيديو", "video.delete": "حذف فيديو",
        "request.status": "تغيير حالة طلب", "settings.update": "تحديث إعدادات التواصل"
      })[action] || action || "تغيير إداري";
    }

    function renderAudit() {
      const box = $("audit-list");
      if (!box) return;
      box.textContent = "";
      if (!auditCache.length) { box.innerHTML = '<div class="empty">لا توجد تغييرات مسجلة بعد.</div>'; return; }
      auditCache.forEach((entry) => {
        const item = document.createElement("div");
        item.className = "item";
        const main = document.createElement("div");
        const title = document.createElement("div"); title.className = "audit-action"; title.textContent = auditActionLabel(entry.action);
        const meta = document.createElement("div"); meta.className = "item-meta"; meta.textContent = `${entry.targetType || "—"} · ${entry.targetId || "—"} · ${entry.actorEmail || entry.actorUid || "—"}`;
        main.append(title, meta);
        const time = document.createElement("div"); time.className = "audit-time"; time.textContent = fmtDate(entry.createdAt);
        item.append(main, time); box.appendChild(item);
      });
    }

    function renderStats() {
      const editedCount = Object.keys(contentCache.texts || {}).length;
      const requestsCount = requestsCache.length;
      const newRequestsCount = requestsCache.filter((r) => (r.status || "new") === "new").length;
      const videosCount = (contentCache.videos || []).length;
      const settings = contentCache.settings || {};
      const configuredChannels = [Boolean(settings.whatsappNumber), Boolean(settings.telegramUsername)].filter(Boolean).length;

      $("stat-requests").textContent = String(requestsCount);
      $("stat-texts").textContent = String(editedCount);
      $("stat-videos").textContent = String(videosCount);
      if ($("stat-registry")) $("stat-registry").textContent = String(contentRegistry.length);

      $("badge-requests").textContent = String(newRequestsCount);
      $("badge-texts").textContent = String(editedCount);
      $("badge-videos").textContent = String(videosCount);
      if ($("badge-audit")) $("badge-audit").textContent = String(auditCache.length);

      if ($("overview-cap-texts")) $("overview-cap-texts").textContent = String(contentRegistry.length);
      if ($("overview-cap-requests")) $("overview-cap-requests").textContent = String(requestsCount);
      if ($("overview-cap-videos")) $("overview-cap-videos").textContent = String(videosCount);
      if ($("overview-cap-settings")) $("overview-cap-settings").textContent = String(configuredChannels) + '/2';
      if ($("overview-edited-texts")) $("overview-edited-texts").textContent = String(editedCount);
      if ($("overview-new-requests")) $("overview-new-requests").textContent = String(newRequestsCount);
      if ($("overview-settings-state")) $("overview-settings-state").textContent = String(configuredChannels) + '/2';
      if ($("overview-audit-count")) $("overview-audit-count").textContent = String(auditCache.length);
    }

    function renderRequests() {
      const box = $("requests-list");
      const q = ($("request-search").value || "").trim().toLowerCase();
      const status = $("request-status-filter").value;

      box.textContent = "";

      const rows = requestsCache.filter((r) => {
        const rs = r.status || "new";
        const hay = [r.fullName, r.phone, r.whatsapp, r.email, r.country, r.track, r.persona, r.locale, r.message, r.goal, rs].join(" ").toLowerCase();

        return (status === "all" || rs === status) && (!q || hay.includes(q));
      });

      if (!rows.length) {
        box.innerHTML = '<div class="empty">لا توجد طلبات مطابقة.</div>';
        return;
      }

      rows.forEach((r) => {
        const item = document.createElement("div");
        item.className = "item";

        item.innerHTML = `
          <div class="item-head">
            <div>
              <div class="item-title"></div>
              <div class="item-meta"></div>
            </div>
            <span class="pill"></span>
          </div>
          <p class="muted" style="line-height:1.8;margin:0 0 12px;"></p>
          <div class="row-actions">
            <select class="request-status">
              <option value="new">جديد</option>
              <option value="contacted">تم التواصل</option>
              <option value="pending">مؤجل</option>
              <option value="accepted">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
            <button class="btn small ok" type="button">حفظ الحالة</button>
          </div>
        `;

        item.querySelector(".item-title").textContent = r.fullName || "بدون اسم";
        item.querySelector(".item-meta").textContent = `${r.phone || r.whatsapp || r.email || "—"} | ${r.country || "—"} | ${r.track || "—"} | ${fmtDate(r.submissionDate)} | ${r.sourceCollection || "—"}`;

        const contactActions = item.querySelector(".row-actions");
        const rawWhatsapp = String(r.whatsapp || r.phone || "").replace(/[^0-9+]/g, "");
        const waDigits = rawWhatsapp.replace(/\D/g, "");
        if (waDigits.length >= 6) {
          const wa = document.createElement("a");
          wa.className = "btn small secondary";
          wa.target = "_blank";
          wa.rel = "noopener noreferrer";
          wa.href = `https://wa.me/${waDigits}`;
          wa.textContent = "فتح WhatsApp";
          contactActions.appendChild(wa);
        }
        if (r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.email))) {
          const mail = document.createElement("a");
          mail.className = "btn small secondary";
          mail.href = `mailto:${encodeURIComponent(String(r.email))}`;
          mail.textContent = "إرسال بريد";
          contactActions.appendChild(mail);
        }
        item.querySelector(".pill").textContent = statusLabel(r.status || "new");
        item.querySelector("p").textContent = r.message || "لا توجد رسالة.";

        const select = item.querySelector(".request-status");
        select.value = r.status || "new";

        const saveStatusButton = item.querySelector("button");
        saveStatusButton.addEventListener("click", async () => {
          const previousStatus = r.status || "new";
          const nextStatus = select.value;
          const pill = item.querySelector(".pill");

          if (nextStatus === previousStatus) {
            showStatus("الحالة محفوظة بالفعل.", "warning");
            return;
          }

          // Optimistic visual state: the interface responds immediately, while
          // Firestore remains authoritative. Any failure rolls the UI back.
          item.classList.add("is-native-pending");
          if (pill) pill.textContent = statusLabel(nextStatus) + " · جار الحفظ";
          select.disabled = true;

          try {
            await runBusy(saveStatusButton, async () => {
              await updateRequestStatus(r.id, nextStatus, r.sourceCollection || "enrollment_requests");
            });
          } catch (error) {
            console.error("Request status update failed:", error);
            if (pill) pill.textContent = statusLabel(previousStatus);
            select.value = previousStatus;
            showStatus(error && error.message ? error.message : "تعذر حفظ حالة الطلب.", "error");
          } finally {
            select.disabled = false;
            item.classList.remove("is-native-pending");
          }
        });

        box.appendChild(item);
      });
    }

    async function updateRequestStatus(id, status, sourceCollection) {
      const safeCollection = sourceCollection === "assessment_requests" ? "assessment_requests" : "enrollment_requests";
      if (!["new", "contacted", "pending", "accepted", "rejected"].includes(status)) {
        showStatus("حالة الطلب غير صحيحة.", "error"); return;
      }
      const batch = writeBatch(db);
      batch.update(doc(db, safeCollection, id), {
        status: status,
        handledAt: serverTimestamp(),
        handledBy: currentUser ? currentUser.email || currentUser.uid : "admin"
      });
      appendAuditToBatch(batch, "request.status", "request", id, { collection: safeCollection, status });
      await batch.commit();
      await Promise.all([loadRequests(), loadAudit()]);
      showStatus("تم تحديث حالة الطلب وتسجيل العملية.", "success");
    }

    function renderTexts() {
      const box = $("texts-list");
      const q = ($("text-search").value || "").trim().toLowerCase();
      const lang = $("text-lang-filter").value;
      const page = $("text-page-filter") ? $("text-page-filter").value : "all";
      const section = $("text-section-filter") ? $("text-section-filter").value : "all";
      box.textContent = "";

      const rows = contentRegistry.filter((item) => {
        const effective = getEffectiveText(item);
        const hay = `${item.id} ${item.text || ""} ${effective} ${item.section || ""}`.toLowerCase();
        return (lang === "all" || item.lang === lang) &&
          (page === "all" || (item.page || "index.html") === page) &&
          (section === "all" || (item.section || "global") === section) &&
          (!q || hay.includes(q));
      });

      if ($("text-results-count")) {
        const edited = rows.filter((item) => hasOverride(item.id)).length;
        $("text-results-count").textContent = `${rows.length} عنصرًا مطابقًا · ${edited} منها معدّل في Firestore`;
      }

      if (!rows.length) {
        box.innerHTML = '<div class="empty">لا توجد نصوص مطابقة. حدّث الفهرس أو غيّر عوامل البحث.</div>';
        return;
      }

      const visibleRows = rows.slice(0, 300);
      visibleRows.forEach((itemData) => {
        const value = getEffectiveText(itemData);
        const item = document.createElement("button");
        item.type = "button";
        item.className = "item";
        item.style.textAlign = "right";
        item.innerHTML = `
          <div class="item-head">
            <div>
              <div class="item-title"></div>
              <div class="item-meta"></div>
            </div>
            <span class="pill"></span>
          </div>
          <p class="muted" style="margin:0;line-height:1.8;"></p>
        `;
        item.querySelector(".item-title").textContent = `${pageLabel(itemData.page)} · ${sectionLabel(itemData.section)}`;
        item.querySelector(".item-meta").textContent = `${itemData.page || "index.html"} · ${itemData.id} · ${value.length} حرفًا`;
        item.querySelector(".pill").textContent = `${(itemData.lang || guessLang(itemData.id) || "—").toUpperCase()}${hasOverride(itemData.id) ? " · معدّل" : ""}`;
        item.querySelector("p").textContent = value.slice(0, 220);
        item.addEventListener("click", () => fillTextForm(itemData.id));
        box.appendChild(item);
      });
      if (rows.length > visibleRows.length) {
        const note = document.createElement("div");
        note.className = "empty";
        note.textContent = `يظهر أول ${visibleRows.length} عنصرًا. استخدم البحث أو القسم للوصول إلى البقية.`;
        box.appendChild(note);
      }
    }

    function fillTextForm(id) {
      const item = currentRegistryItem(id);
      if (!item) { showStatus("هذا المعرّف غير موجود في فهرس الموقع الحالي.", "error"); return; }
      $("text-id").value = id;
      $("text-value").value = getEffectiveText(item);
      $("text-original-preview").textContent = item.text || "—";
      $("text-section-readonly").textContent = `${pageLabel(item.page)} · ${sectionLabel(item.section)}`;
      $("text-lang-readonly").textContent = (item.lang || guessLang(id) || "—").toUpperCase();
      const preview = $("text-preview-link");
      if (preview) {
        const page = item.page && item.page !== "index.html" ? `./${item.page}` : "./";
        preview.href = item.section && item.section !== "global" ? `${page}#${encodeURIComponent(item.section)}` : page;
        preview.classList.remove("hidden");
      }
      $("text-value").focus();
    }

    async function saveText(event) {
      event.preventDefault();
      const id = ($("text-id").value || "").trim();
      const value = ($("text-value").value || "").trim();
      const item = currentRegistryItem(id);
      if (!item) { showStatus("اختر نصًا من فهرس الموقع أولًا.", "error"); return; }
      if (!value || value.length > 12000) { showStatus("النص فارغ أو يتجاوز الحد المسموح.", "error"); return; }

      const texts = { ...(contentCache.texts || {}) };
      const original = String(item.text || "").trim();
      if (value === original) delete texts[id];
      else texts[id] = value;

      const batch = writeBatch(db);
      batch.set(publicRef, { texts }, { merge: true });
      appendAuditToBatch(batch, value === original ? "text.restore" : "text.update", "content", id, {
        lang: item.lang || "", section: item.section || "global"
      });
      await batch.commit();
      await Promise.all([loadContent(), loadAudit()]);
      fillTextForm(id);
      showStatus(value === original ? "النص مطابق للأصل؛ أزيل التعديل من Firestore." : "تم حفظ النص بأمان.", "success");
    }

    async function deleteText() {
      const id = ($("text-id").value || "").trim();
      const item = currentRegistryItem(id);
      if (!item) return;
      if (!hasOverride(id)) {
        $("text-value").value = item.text || "";
        showStatus("هذا النص يستخدم الأصل بالفعل ولا يوجد تعديل محفوظ.", "warning");
        return;
      }
      if (!confirm("استعادة النص الأصلي وإزالة التعديل المحفوظ في Firestore؟")) return;
      const texts = { ...(contentCache.texts || {}) };
      delete texts[id];
      const batch = writeBatch(db);
      batch.set(publicRef, { texts }, { merge: true });
      appendAuditToBatch(batch, "text.restore", "content", id, { lang: item.lang || "", section: item.section || "global" });
      await batch.commit();
      await Promise.all([loadContent(), loadAudit()]);
      fillTextForm(id);
      showStatus("تمت استعادة النص الأصلي.", "success");
    }

    async function scanContentIds() {
      try {
        showStatus("جار تحديث فهرس النصوص من ملفات الموقع...", "warning");
        await loadContentRegistry();
        showStatus(`تم تحديث الفهرس الشامل: ${contentRegistry.length} عنصرًا نصيًا عبر صفحات الموقع، دون نسخ النصوص الأصلية إلى Firestore.`, "success");
      } catch (error) {
        console.error(error);
        showStatus("فشل تحديث فهرس الموقع.", "error");
      }
    }

    function safeUrl(value, label) {
      const url = new URL(value);

      if (url.protocol !== "https:") throw new Error(label + " يجب أن يبدأ بـ https://");
      if (url.username || url.password) throw new Error(label + " يجب ألا يحتوي اسم مستخدم أو كلمة مرور داخل الرابط.");
      if (url.href.length > 2048) throw new Error(label + " طويل جدًا.");
      return url.href;
    }

    function renderVideos() {
      const box = $("videos-list");
      box.textContent = "";

      const videos = contentCache.videos || [];

      if (!videos.length) {
        box.innerHTML = '<div class="empty">لا توجد فيديوهات.</div>';
        return;
      }

      videos.forEach((video, index) => {
        const item = document.createElement("div");
        item.className = "item";

        item.innerHTML = `
          <div class="item-head">
            <div>
              <div class="item-title"></div>
              <div class="item-meta"></div>
            </div>
            <span class="pill"></span>
          </div>
          <div class="row-actions">
            <button class="btn small" type="button">تعديل</button>
            <button class="btn small danger" type="button">حذف</button>
          </div>
        `;

        item.querySelector(".item-title").textContent = video.title || "بدون عنوان";
        item.querySelector(".item-meta").textContent = video.videoUrl || "—";
        item.querySelector(".pill").textContent = (video.published === false ? "غير منشور · " : "منشور · ") + (video.category || "all");

        const buttons = item.querySelectorAll("button");

        buttons[0].addEventListener("click", () => fillVideoForm(index));
        buttons[1].addEventListener("click", () => deleteVideo(index));

        box.appendChild(item);
      });
    }

    function fillVideoForm(index) {
      const video = contentCache.videos[index];

      if (!video) return;

      $("video-index").value = String(index);
      $("video-title").value = video.title || "";
      $("video-category").value = video.category || "all";
      $("video-url").value = video.videoUrl || "";
      $("video-image").value = video.posterUrl || video.imageUrl || "";
      $("video-published").checked = video.published !== false;
    }

    async function saveVideo(event) {
      event.preventDefault();

      const title = ($("video-title").value || "").trim();
      const category = $("video-category").value || "all";
      const videoUrl = safeUrl(($("video-url").value || "").trim(), "رابط الفيديو");
      const posterValue = ($("video-image").value || "").trim();
      const posterUrl = posterValue ? safeUrl(posterValue, "رابط صورة الغلاف") : "";

      if (title.length < 2 || title.length > 120) {
        showStatus("عنوان الفيديو غير صحيح.", "error");
        return;
      }

      const videos = [...(contentCache.videos || [])];
      const index = $("video-index").value === "" ? -1 : Number.parseInt($("video-index").value, 10);

      const data = {
        title: title,
        category: category,
        videoUrl: videoUrl,
        posterUrl: posterUrl,
        published: $("video-published").checked,
        updatedAt: new Date().toISOString()
      };

      const action = index >= 0 && index < videos.length ? "video.update" : "video.create";
      if (index >= 0 && index < videos.length) {
        videos[index] = { ...videos[index], ...data };
      } else {
        if (videos.length >= 250) throw new Error("بلغت مكتبة الفيديو حد الأمان (250 فيديو). احذف أو أرشف عناصر قبل إضافة المزيد.");
        videos.push({ ...data, createdAt: new Date().toISOString() });
      }

      const batch = writeBatch(db);
      batch.set(publicRef, { videos }, { merge: true });
      appendAuditToBatch(batch, action, "video", String(index >= 0 ? index : videos.length - 1), { category, published: data.published });
      await batch.commit();

      clearVideoForm();
      await Promise.all([loadContent(), loadAudit()]);

      showStatus("تم حفظ الفيديو وتسجيل العملية.", "success");
    }

    async function deleteVideo(index) {
      if (!confirm("حذف هذا الفيديو؟")) return;

      const videos = [...(contentCache.videos || [])];
      const removed = videos[index] || {};
      videos.splice(index, 1);

      const batch = writeBatch(db);
      batch.set(publicRef, { videos }, { merge: true });
      appendAuditToBatch(batch, "video.delete", "video", String(index), { category: removed.category || "", published: removed.published !== false });
      await batch.commit();
      await Promise.all([loadContent(), loadAudit()]);

      showStatus("تم حذف بيانات الفيديو وتسجيل العملية.", "success");
    }

    function clearVideoForm() {
      $("video-form").reset();
      $("video-index").value = "";
      $("video-published").checked = true;
    }

    function normalizeWhatsappNumber(value) {
      const digits = String(value || "").replace(/\D/g, "");
      if (!digits) return "";
      if (digits.length < 8 || digits.length > 15) {
        throw new Error("رقم WhatsApp يجب أن يكون بصيغة دولية من 8 إلى 15 رقمًا.");
      }
      return digits;
    }

    function normalizeTelegramUsername(value) {
      const username = String(value || "").trim().replace(/^@+/, "");
      if (!username) return "";
      if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) {
        throw new Error("اسم Telegram يجب أن يكون من 5 إلى 32 حرفًا إنجليزيًا/رقمًا أو شرطة سفلية، ومن دون @.");
      }
      return username;
    }

    function renderContactSettings() {
      if (!$('settings-whatsapp') || !$('settings-telegram')) return;
      const settings = contentCache.settings || {};
      $('settings-whatsapp').value = String(settings.whatsappNumber || '201070441115');
      $('settings-telegram').value = String(settings.telegramUsername || 'BasairAcademy0');
    }

    async function saveContactSettings(event) {
      event.preventDefault();
      if (!currentUser || !isAdmin) {
        showStatus("ليست لديك صلاحية الإدارة.", "error");
        return;
      }
      try {
        const whatsappNumber = normalizeWhatsappNumber($('settings-whatsapp').value);
        const telegramUsername = normalizeTelegramUsername($('settings-telegram').value);
        if (!whatsappNumber && !telegramUsername) {
          throw new Error("أدخل وسيلة تواصل واحدة على الأقل.");
        }
        const settings = {
          whatsappNumber,
          telegramUsername,
          updatedAt: new Date().toISOString()
        };
        const batch = writeBatch(db);
        batch.set(publicRef, { settings }, { merge: true });
        appendAuditToBatch(batch, "settings.update", "settings", "contact", {
          whatsappConfigured: Boolean(whatsappNumber),
          telegramConfigured: Boolean(telegramUsername)
        });
        await batch.commit();
        await Promise.all([loadContent(), loadAudit()]);
        showStatus("تم حفظ إعدادات التواصل وتطبيقها على روابط الموقع الديناميكية.", "success");
      } catch (error) {
        console.error("Save contact settings failed:", error);
        showStatus(error && error.message ? error.message : "تعذر حفظ إعدادات التواصل.", "error");
      }
    }

    function friendlyAuthError(error) {
      const code = error && error.code ? error.code : "auth/unknown";
      const message = error && error.message ? error.message : "";
      const host = window.location.hostname || "هذا النطاق";
      const combined = `${code} ${message}`;

      if (combined.includes("requests-from-referer") && combined.includes("are-blocked")) {
        return `Firebase يمنع الطلبات القادمة من ${window.location.origin}. هذا إعداد خارجي للمشروع وليس خطأ كلمة مرور: أضف localhost إلى Firebase Authentication → Settings → Authorized domains، واسمح بـ http://localhost:3000/* في Website restrictions لمفتاح Firebase Web API.`;
      }

      const messages = {
        "auth/unauthorized-domain": `Firebase لا يسمح حاليًا بالنطاق ${host}. أضفه في Authentication → Settings → Authorized domains.`,
        "auth/operation-not-allowed": "طريقة تسجيل الدخول هذه غير مفعلة. فعّل Google و/أو Email/Password من Firebase Authentication → Sign-in method.",
        "auth/configuration-not-found": "إعداد Firebase Authentication غير مكتمل لهذا المشروع. افتح Authentication في Firebase Console وأكمل الإعداد ثم أعد المحاولة.",
        "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحين، أو أن الحساب لا يملك طريقة الدخول هذه.",
        "auth/user-disabled": "هذا الحساب معطّل داخل Firebase Authentication.",
        "auth/too-many-requests": "تم إيقاف المحاولات مؤقتًا بسبب كثرتها. حاول لاحقًا.",
        "auth/network-request-failed": "تعذر الوصول إلى Firebase. تحقق من الإنترنت أو مانع الإعلانات/الجدار الناري.",
        "auth/internal-error": host === "127.0.0.1"
          ? "تعذر Firebase Auth على 127.0.0.1. شغّل المشروع عبر npm run dev وافتح رابط localhost الذي يظهر في الطرفية؛ إعداد التطوير أصبح يستخدم localhost لتوافق أفضل مع Authorized domains."
          : `تعذر إكمال مصادقة Firebase من ${host}. تأكد من تفعيل طريقة الدخول ومن وجود ${host} في Authorized domains، ثم أعد المحاولة.`,
        "auth/popup-closed-by-user": "أُغلقت نافذة تسجيل الدخول قبل إتمام العملية."
      };
      return messages[code] || `${code} — ${message || "فشل تسجيل الدخول"}`;
    }

    async function runBusy(button, task) {
      if (!button || button.disabled) return;
      const original = button.innerHTML;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.classList.add("is-loading");
      try { await task(); }
      finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.classList.remove("is-loading");
        button.innerHTML = original;
      }
    }

    function createRafScheduler(callback) {
      let raf = 0;
      return function () {
        if (raf) window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          callback();
        });
      };
    }

    async function runFormAction(event, task) {
      event.preventDefault();
      const form = event.currentTarget;
      const button = event.submitter instanceof HTMLButtonElement
        ? event.submitter
        : form.querySelector('button[type="submit"], input[type="submit"]');
      try {
        await runBusy(button, async () => {
          form.setAttribute("aria-busy", "true");
          try { await task(event); }
          finally { form.removeAttribute("aria-busy"); }
        });
      } catch (error) {
        console.error("Admin form action failed:", error);
        showStatus(error && error.message ? error.message : "تعذر إتمام العملية. حاول مرة أخرى.", "error");
      }
    }

    async function initializeAdminPage() {
      $("firebase-project-label").textContent = FIREBASE_PROJECT_ID;
      const currentOrigin = window.location.origin || "local";
      $("auth-help").textContent = `المشروع: ${FIREBASE_PROJECT_ID} • النطاق الحالي: ${currentOrigin}`;

      await setPersistence(auth, browserLocalPersistence).catch((error) => console.warn("Auth persistence:", error));
      if (sessionStorage.getItem(AUTH_REDIRECT_FLAG) === "1") {
        sessionStorage.removeItem(AUTH_REDIRECT_FLAG);
        await getRedirectResult(auth).catch((error) => showStatus(friendlyAuthError(error), "error"));
      }

      $("email-login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = ($("admin-email").value || "").trim();
      const password = $("admin-password").value || "";
      if (!email || password.length < 6) {
        showStatus("اكتب بريد المدير وكلمة المرور الصحيحة.", "error");
        return;
      }
      await runBusy($("email-login-btn"), async () => {
        try {
          showStatus("جار تسجيل الدخول والتحقق من صلاحية الإدارة...", "warning");
          await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          console.error(error);
          showStatus(friendlyAuthError(error), "error");
        }
      });
    });

    $("google-login-btn").addEventListener("click", async () => {
      await runBusy($("google-login-btn"), async () => {
        try {
          showStatus("جار فتح تسجيل الدخول بحساب Google...", "warning");
          await signInWithPopup(auth, googleProvider);
        } catch (error) {
          console.error(error);
          if (error && ["auth/popup-blocked", "auth/cancelled-popup-request", "auth/internal-error"].includes(error.code)) {
            showStatus(error.code === "auth/internal-error"
              ? "تعذر إكمال الدخول عبر النافذة المنبثقة؛ نجرب الآن التحويل المباشر إلى Google."
              : "تعذر فتح النافذة المنبثقة؛ سيتم استخدام التحويل الآمن إلى Google.", "warning");
            try {
              sessionStorage.setItem(AUTH_REDIRECT_FLAG, "1");
              await signInWithRedirect(auth, googleProvider);
            } catch (redirectError) {
              sessionStorage.removeItem(AUTH_REDIRECT_FLAG);
              console.error(redirectError);
              showStatus(friendlyAuthError(redirectError), "error");
            }
            return;
          }
          showStatus(friendlyAuthError(error), "error");
        }
      });
    });

    $("logout-btn").addEventListener("click", () => signOut(auth));
    $("refresh-all-btn").addEventListener("click", loadAll);
    $("refresh-requests-btn").addEventListener("click", loadRequests);
    $("firebase-health-btn").addEventListener("click", async () => {
      await runBusy($("firebase-health-btn"), async () => {
        try {
          showStatus("جار فحص اتصال Firestore...", "warning");
          await getDoc(publicRef);
          showStatus(`اتصال Firestore ناجح بالمشروع ${FIREBASE_PROJECT_ID}. إذا فشل تسجيل الدخول وحده فالمشكلة في إعداد Authentication/API Key الخارجي.`, "success");
        } catch (error) {
          console.error("Firebase health check:", error);
          const code = error && error.code ? error.code : "firebase/unknown";
          showStatus(`${code} — ${error && error.message ? error.message : "تعذر الاتصال بـ Firebase"}`, "error");
        }
      });
    });

    const scheduleRenderRequests = createRafScheduler(renderRequests);
    const scheduleRenderTexts = createRafScheduler(renderTexts);
    $("request-search").addEventListener("input", scheduleRenderRequests);
    $("request-status-filter").addEventListener("change", renderRequests);

    $("text-search").addEventListener("input", scheduleRenderTexts);
    $("text-lang-filter").addEventListener("change", renderTexts);
    if ($("text-page-filter")) $("text-page-filter").addEventListener("change", renderTexts);
    if ($("text-section-filter")) $("text-section-filter").addEventListener("change", renderTexts);
    $("text-form").addEventListener("submit", (event) => runFormAction(event, saveText));
    $("clear-text-btn").addEventListener("click", () => {
      $("text-id").value = ""; $("text-value").value = "";
      if ($("text-original-preview")) $("text-original-preview").textContent = "اختر عنصرًا من القائمة.";
      if ($("text-section-readonly")) $("text-section-readonly").textContent = "—";
      if ($("text-lang-readonly")) $("text-lang-readonly").textContent = "—";
      if ($("text-preview-link")) $("text-preview-link").classList.add("hidden");
    });
    $("delete-text-btn").addEventListener("click", deleteText);
    $("scan-content-ids-btn").addEventListener("click", scanContentIds);

    $("video-form").addEventListener("submit", (event) => runFormAction(event, saveVideo));
    if ($("refresh-audit-btn")) $("refresh-audit-btn").addEventListener("click", loadAudit);
    $("clear-video-btn").addEventListener("click", clearVideoForm);

    if ($("contact-settings-form")) $("contact-settings-form").addEventListener("submit", (event) => runFormAction(event, saveContactSettings));
    if ($("settings-reset-btn")) $("settings-reset-btn").addEventListener("click", renderContactSettings);

    if ($("overview-open-firestore")) $("overview-open-firestore").addEventListener("click", () => {
      window.open(`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/-default-/data`, "_blank", "noopener,noreferrer");
    });
    if ($("overview-open-auth")) $("overview-open-auth").addEventListener("click", () => {
      window.open(`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/users`, "_blank", "noopener,noreferrer");
    });

    $("copy-uid-btn").addEventListener("click", async () => {
      if (!currentUser) return;

      try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("CLIPBOARD_UNAVAILABLE");
        await navigator.clipboard.writeText(currentUser.uid); flashButtonLabel($("copy-uid-btn"), "تم النسخ ✓"); showStatus("تم نسخ UID.", "success");
      } catch (_) {
        const selection=window.getSelection(), uidBox=$("uid-box"); if(selection&&uidBox){const range=document.createRange();range.selectNodeContents(uidBox);selection.removeAllRanges();selection.addRange(range)}
        showStatus("تعذر النسخ التلقائي. تم تحديد UID؛ انسخه يدويًا بـ Ctrl+C.", "warning");
      }
    });

      onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        isAdmin = false;

        if (!user) {
          renderAuth();
          return;
        }

        try {
          isAdmin = await checkAdminRole(user);
          renderAuth();

          if (isAdmin) {
            showStatus("تم تسجيل الدخول كمدير. جار تحميل البيانات...", "success");
            await loadAll();
          } else {
            showStatus("تمت المصادقة في Firebase، لكن هذا المستخدم لا يملك صلاحية الإدارة بعد. أنشئ المستند admin_roles/UID واجعل active = true، ثم أعد تحميل الصفحة.", "warning");
          }
        } catch (error) {
          console.error(error);
          renderAuth();
          const msg = error && error.code === "permission-denied"
            ? "تم تسجيل الدخول إلى Firebase، لكن قواعد Firestore الحالية تمنع التحقق من admin_roles. انشر firestore.rules الجديدة."
            : "فشل التحقق من صلاحية المدير: " + (error && error.message ? error.message : "خطأ غير معروف");
          showStatus(msg, "error");
        }
      });
    }

    initializeAdminPage().catch((error) => {
      console.error("Admin initialization failed:", error);
      showStatus("تعذر تهيئة لوحة الإدارة: " + (error && error.message ? error.message : "خطأ غير معروف"), "error");
    });
  