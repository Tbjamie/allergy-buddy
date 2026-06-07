# AllergyBuddy

AllergyBuddy is a concept web application designed to help Dutch travelers with food allergies make safer choices when eating out abroad. The project focuses on reducing stress, miscommunication, and uncertainty in restaurant situations by combining restaurant discovery, allergy communication support, and emergency guidance in one digital experience.

The current pilot context for the project is **Turkey**, where language barriers, unfamiliar ingredients, and unclear allergen communication can make eating out more stressful for travelers with severe food allergies.

## Project goal

AllergyBuddy was developed as part of a CMD graduation project and aims to answer the following design challenge:

> How can digital support help Dutch travelers with a food allergy make safer choices in restaurants in Turkey, without creating false certainty, while also considering feasibility for restaurants?

## Core features

- **Restaurant discovery**
  Find restaurants and view relevant allergy-related information in one place.

- **Personal allergy profile**
  Create a profile with allergies, severity, emergency details, and relevant medical context.

- **Communication support**
  Show translated allergy information and useful phrases to help communicate clearly with restaurant staff.

- **Emergency flow**
  Access emergency steps and key actions quickly in case of a severe allergic reaction.

- **Allergy facts**
  View allergy facts and see what can lessen or worsen allergic reactions.

## Why this project exists

For many people, eating out while traveling is relaxing and spontaneous. For travelers with a severe food allergy, it is often the opposite. A simple restaurant visit can become a stressful experience because of:

- language barriers
- unclear menus
- hidden ingredients
- uncertainty about cross-contamination
- lack of trustworthy allergen information
- not knowing what to do quickly if something goes wrong

AllergyBuddy aims to reduce that uncertainty by supporting the user across three key moments:

1. **Choosing a restaurant**
2. **Communicating the allergy while ordering**
3. **Acting quickly in an emergency**

## Tech stack

This project is built with:

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **Supabase** for authentication and database
- **Mapbox GL** for map-based restaurant discovery

## Main user flow

A typical user flow looks like this:

1. The user signs in
2. The user adds allergy and severity information
3. The user completes onboarding
4. The user browses restaurants on the map
5. The user opens a restaurant detail page
6. The user uses communication support while ordering
7. If needed, the user can open the emergency flow
