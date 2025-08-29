# PHOS Event Schemas

Event contracts published on NATS. All events include `userId` and `timestamp`.

## Subjects
- `labs.result.created` — A new interpreted lab result was created.
- `nutrition.analysis.completed` — A nutrition analysis was completed.
- `core.recommendation.generated` — A recommendation was generated.

## Usage
- Publishers must validate payloads against the JSON Schemas in this folder before publishing.
- Subscribers should validate incoming events where possible.


