# UI Revamp Plan: Top Navigation Bar

## 1. Problem Statement

The current top navigation bar in the HandyApp Peru mobile app displays the static text "HandyApp Peru" across most, if not all, screens.

**Issues:**

- **Low Utility:** Provides minimal informational value beyond initial branding. Users generally know which app they are in.
- **Poor Usability:** Offers no interactive elements (navigation, actions) and doesn't aid in screen context awareness.
- **Inefficient Screen Real Estate:** Consumes valuable vertical space on mobile screens without providing proportional functionality, pushing down actionable content. This contrasts with modern mobile app patterns (e.g., Airbnb, Uber) that utilize this area dynamically.

## 2. Recommended Solution: Dynamic Contextual Header

Replace the static bar with a dynamic header that provides screen context, navigation controls, and relevant actions.

## 3. Detailed Specifications

### 3.1. Core Components & Behavior

The header bar will contain three potential zones:

- **Left Zone:** Navigation control (Back Arrow).
- **Center/Left-Aligned Zone:** Screen Title.
- **Right Zone:** Contextual Action Buttons.

### 3.2. Title (`Center/Left-Aligned Zone`)

- **Content:** Dynamically displays the title of the current view or primary task (e.g., "Dashboard", "Create Invoice", "Project: Alpha", "Settings").
- **Source:** Preferably sourced from route metadata (`meta: { title: '...' }` in `src/router/index.js`) or set via component props.
- **Alignment:** Left-aligned, positioned immediately to the right of the back button (if present) or at the start of the bar if no back button is shown.
- **Truncation:** Long titles should truncate with an ellipsis (...) and not wrap to maintain consistent bar height.

### 3.3. Back Button (`Left Zone`)

- **Appearance:** Standard platform back arrow icon (`<`).
- **Visibility:** Only displayed on screens deeper in the navigation hierarchy (not top-level screens). Determined by router state.
- **Action:** Triggers standard back navigation (`router.back()`).

### 3.4. Contextual Actions (`Right Zone`)

- **Appearance:** Primarily icon buttons (e.g., Save, Edit, Filter, Search) for space. Text buttons for critical, unclear actions (e.g., "Send").
- **Visibility:** Displayed only when relevant actions are available for the current screen context.
- **Quantity:** Maximum of two actions recommended. Use a "..." menu for more.
- **Placement:** Consistently aligned to the far right.

### 3.5. Branding Integration

- The static "HandyApp Peru" text is removed.
- Branding is maintained via:
  - App Icon.
  - Splash/Loading screen.
  - Consistent UI theme (colors, fonts, styles).
  - _Optional:_ A small logo _only_ on the main top-level dashboard screen (if deemed essential and space permits, potentially replacing the title).

### 3.6. Visual Design

- Standard mobile app bar height.
- Background color aligned with the app theme, potentially with subtle elevation/shadow.
- Typography consistent with the app.

## 4. Example Layouts

```mermaid
graph TD
    subgraph Top-Level Screen (e.g., Dashboard)
        direction LR
        Title["Dashboard"] --> Actions["(Optional Actions e.g., Search)"];
    end

    subgraph Deeper Screen (e.g., Project Details)
        direction LR
         Back["<"] --> Title2["Project: Alpha"];
         Title2 --> Actions2["(Optional Actions e.g., Edit)"];
    end

    subgraph Task Screen (e.g., Create Invoice)
        direction LR
         Back2["<"] --> Title3["Create Invoice"];
         Title3 --> Actions3["(Save Action)"];
    end

    style Title fill:#fff,stroke:#333
    style Title2 fill:#fff,stroke:#333
    style Title3 fill:#fff,stroke:#333
    style Back fill:#eee,stroke:#333
    style Back2 fill:#eee,stroke:#333
    style Actions fill:#eee,stroke:#333
    style Actions2 fill:#eee,stroke:#333
    style Actions3 fill:#eee,stroke:#333
```

This approach creates a functional, context-aware top bar that enhances usability and optimizes screen real estate compared to the previous static implementation.
