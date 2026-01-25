You are a senior Obsidian plugin engineer and TDD expert. Build an Obsidian plugin named Weekly Review (the UI name may stay Weekly Review, but it supports arbitrary review periods).

Your job is to implement a production-quality plugin with strict testability, clean architecture, and deterministic behavior.

⸻

0) Context & constraints
	•	Read and follow AGENTS.md at repo root before doing anything. All conventions there are mandatory.
	•	Use TypeScript and the standard Obsidian plugin scaffold.
	•	Use TDD: write failing tests first, then implement.
	•	All business logic must have 100% unit-test coverage.
	•	UI glue may be excluded from coverage, but:
	•	date range logic
	•	folder filtering
	•	note selection
	•	truncation
	•	prompt composition
	•	filename resolution
	•	LLM response parsing
	•	markdown rendering
must all be fully covered.
	•	Add a pre-commit hook that blocks commits unless:
	•	lint
	•	test
	•	build
all succeed.

⸻

1) User story

As a user, I can run “Weekly Review: Generate review” from the Obsidian command palette.

The plugin:
	1.	Selects notes that were modified during a chosen review period
	2.	Sends them to an LLM
	3.	Generates:
	•	A concise summary of what was done
	•	A list of notable work
	•	Exactly 3 priorities for the next period
	4.	Creates a new markdown review note in a configured folder every time.

⸻

2) Review periods (core requirement)

A review period defines [start, end] used to select changed notes.

Presets

The plugin must support:

Preset	Definition
Current week (default)	Monday 00:00 → now
Current month	1st day of month 00:00 → now
Last 7 days	now − 7 days → now
Last 30 days	now − 30 days → now
Custom	User-supplied start + end

All dates use the user’s local timezone.
Assume Europe/Berlin for deterministic tests unless overridden.

Implement this in a pure module period.ts with:

resolvePeriod(preset, customRange, now, timezone)
→ { start: Date, end: Date, label: string }


⸻

3) Settings UI (persisted)

Add a settings tab with:

A. Folders
	•	Folders to scan (array of paths)
	•	If empty → scan whole vault (show warning)
	•	Output folder
	•	Default: Weekly Reviews/

B. Review period
	•	Default period preset (dropdown)
	•	If preset = Custom:
	•	Start date/time
	•	End date/time
	•	Prompt for period when running (boolean, default true)

C. LLM configuration

(for Ollama-style HTTP APIs)
	•	Base URL (default http://localhost:11434)
	•	Endpoint path (default /api/chat)
	•	Model name (e.g. llama3.1)
	•	Optional API key header name + value
	•	Temperature (default 0.2)
	•	Max tokens (default 1000)
	•	Timeout seconds (default 60)

D. Payload limits
	•	Max notes (default 50)
	•	Max chars per note (default 6000)
	•	Optional system prompt override

⸻

4) Command UX

Command:
Weekly Review: Generate review

When invoked:
	1.	If Prompt for period on run is enabled:
	•	Show modal:
	•	Preset dropdown (defaulted from settings)
	•	Custom start/end if selected
	•	Checkbox: “Save as default”
	•	Cancel → abort
	2.	Resolve review period using resolvePeriod
	3.	Scan vault for markdown files:
	•	In selected folders
	•	mtime ∈ [start, end]
	4.	Sort by mtime descending
	5.	Limit to max notes
	6.	Build evidence pack
	7.	Call LLM
	8.	Create new review note

Show:
	•	Notice on start
	•	Notice on success (with filename)
	•	Notice on error (clear, actionable)

⸻

5) Evidence pack (deterministic)

For each selected note:
	•	path
	•	title (frontmatter title else filename)
	•	modified time (ISO)
	•	excerpt (truncate deterministically to max chars)

⸻

6) Output note (strict format)

Always create a new note.

Filename:

YYYY-MM-DD Weekly Review.md

(date = today, local)

If file exists:

YYYY-MM-DD Weekly Review (2).md
(3), (4), ...

This behavior must be deterministic and tested.

Frontmatter:

week_start: YYYY-MM-DD  # Monday of the week containing period.start
period_start: ISO
period_end: ISO
period_preset: current_week | current_month | last_7_days | last_30_days | custom
generated_at: ISO
scanned_folders: [...]
model: ...

Body sections (exact headings):

## Weekly summary
## Notable work
## Priorities for next week
## Notes reviewed

Even if the period is not weekly, these headings remain unchanged.

⸻

7) LLM requirements

Use a single structured request.

The prompt must:
	•	Provide period start/end and preset label
	•	Provide list of notes with metadata + excerpts
	•	Instruct the model to:
	•	Output markdown only
	•	Be concise
	•	Produce exactly 3 priorities
	•	Give a brief rationale for each
	•	Reference notes using Obsidian links where possible
	•	Use the provided headings verbatim

Implement:
	•	timeout
	•	defensive JSON parsing
	•	max 1 retry on network failure
	•	clean error messages

⸻

8) Architecture (must be testable)

Separate logic into pure modules:
	•	period.ts – date window logic
	•	scan.ts – folder filtering + mtime filtering + sorting
	•	evidence.ts – excerpt + truncation
	•	prompt.ts – LLM prompt construction
	•	llmClient.ts – HTTP client
	•	render.ts – markdown rendering
	•	filenames.ts – collision-safe filename resolution
	•	main.ts – Obsidian glue

Vault access must be abstracted via interfaces so it can be mocked.

⸻

9) Testing (strict)

Use Vitest.

Must cover:
	•	All period presets
	•	Monday week boundaries
	•	Month boundaries
	•	Custom ranges
	•	Folder inclusion/exclusion
	•	Mtime filtering
	•	Sorting
	•	Truncation
	•	Filename (2)/(3) logic
	•	Markdown output
	•	LLM response parsing (good + malformed)

Business logic coverage must be 100%.

⸻

10) Tooling

Add:
	•	ESLint
	•	Prettier
	•	npm scripts:
	•	lint
	•	test
	•	build

Add Husky pre-commit hook running all three.

⸻

11) Definition of done
	•	Plugin installs and runs in Obsidian
	•	Settings persist
	•	Period selection works
	•	Correct notes are selected
	•	New review note is created every run
	•	LLM integration works with Ollama
	•	100% coverage for business logic
	•	Pre-commit blocks bad commits
	•	README explains:
	•	configuring folders
	•	configuring Ollama
	•	running reviews
	•	common errors

⸻

12) No further questions

Proceed with these requirements. If anything is ambiguous, choose the simplest option, encode it in tests, and document it in README.