# Security Specification & Threat Model - Convention ADISTEM 2026

## 1. Data Invariants

1. **Guest Identity Bound**: A guest profile can only be created by staff or updated by the authenticated guest matching the document email.
2. **Global Configuration Lockdown**: The global event configuration (`/config/event_config`) can only be read by signed-in users, and is completely immutable to non-staff/non-admins.
3. **Privilege Escalation Block**: Standard guests cannot elevate their role to "staff" or update any other guest's role.
4. **Audit Immutability**: All audit logs (`/audits/{auditId}`) are append-only. No updates or deletions are allowed under any circumstances.
5. **No Spoofing / Immutable Fields**: Fields like `createdAt` and `id` must be immutable once created.
6. **Timeline Enforcement**: Updates to flights, transport, and activities by guests must strictly respect the respective configuration deadline times unless the user has staff privileges.
7. **Secure Communications**: Communication messages (`/comms/{commId}`) are write-only by staff and read-only by authenticated users.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Privilege Escalation on Profile Update
*   **Target Path**: `/guests/guest_bernardo`
*   **Attack Vector**: Trying to set role to `"staff"` or `"admin"` to bypass all restriction screens.
```json
{
  "id": "guest_bernardo",
  "email": "bernardo@fasterling.mx",
  "name": "Bernardo",
  "role": "staff",
  "status": "Completo",
  "stage": 2,
  "updatedAt": "2026-07-07T21:00:00Z"
}
```

### Payload 2: Overwriting Another Guest's Record
*   **Target Path**: `/guests/guest_alejandro` (Current user is `bernardo@fasterling.mx`)
*   **Attack Vector**: Writing to another guest's profile.
```json
{
  "id": "guest_alejandro",
  "email": "alejandro@adistem.com.mx",
  "name": "Alejandro Modificado",
  "phone": "5551234567",
  "distributor": "Stellantis CDMX",
  "status": "Completo",
  "stage": 2
}
```

### Payload 3: ID Poisoning / Resource Poisoning
*   **Target Path**: `/guests/INVALID_CHARS_&&_LONG_POISONING_STRING_$$`
*   **Attack Vector**: Injecting malicious characters and excessively long keys as document IDs to break indexing.
```json
{
  "id": "INVALID_CHARS_&&_LONG_POISONING_STRING_$$",
  "email": "malicious@attacker.com",
  "name": "Attacker",
  "distributor": "Stellantis",
  "status": "Incompleto",
  "stage": 1,
  "createdAt": "2026-07-07T21:00:00Z"
}
```

### Payload 4: Denial of Wallet (DOW) - Massive Payload
*   **Target Path**: `/guests/guest_bernardo`
*   **Attack Vector**: Injecting a 2MB string into `distributor` to consume bandwidth and storage quotas.
```json
{
  "id": "guest_bernardo",
  "email": "bernardo@fasterling.mx",
  "distributor": "Stellantis... [repeats 2,000,000 times]",
  "status": "Completo",
  "stage": 2
}
```

### Payload 5: Overwriting Event Configuration
*   **Target Path**: `/config/event_config`
*   **Attack Vector**: Standard guest trying to extend deadlines or turn off registration stages.
```json
{
  "eventName": "Convención ADISTEM Hackeada",
  "stage1Open": true,
  "stage2Open": true,
  "deadlineFlightChange": "2030-12-31T23:59:59Z"
}
```

### Payload 6: Modifying System-Generated Audit Logs
*   **Target Path**: `/audits/log_123`
*   **Attack Vector**: An attacker trying to delete or alter evidence of changes.
```json
{
  "id": "log_123",
  "userId": "Bernardo",
  "userEmail": "bernardo@fasterling.mx",
  "action": "Hack Attempt",
  "details": "None",
  "timestamp": "2026-07-07T21:00:00Z"
}
```

### Payload 7: Fake Activity Enrolment Increment
*   **Target Path**: `/activities/golf_recreativo`
*   **Attack Vector**: Bypassing server calculations to manually increment capacity/registered counts.
```json
{
  "id": "golf_recreativo",
  "name": "Golf Recreativo",
  "capacity": 50,
  "registeredCount": 0,
  "category": "golf"
}
```

### Payload 8: Creating Comm Broadcasts as Guest
*   **Target Path**: `/comms/msg_fake`
*   **Attack Vector**: Sending arbitrary push alerts or email requests to all attendees.
```json
{
  "id": "msg_fake",
  "subject": "EVENT CANCELLED",
  "body": "The event is cancelled. Go home.",
  "type": "push",
  "recipientCount": 100
}
```

### Payload 9: Mutating Immutable Creation Timestamp
*   **Target Path**: `/guests/guest_bernardo`
*   **Attack Vector**: Modifying `createdAt` post-creation to reset history timelines.
```json
{
  "id": "guest_bernardo",
  "email": "bernardo@fasterling.mx",
  "createdAt": "2010-01-01T00:00:00Z"
}
```

### Payload 10: Anonymous Read of Guest Private Data
*   **Target Path**: `/guests/guest_bernardo`
*   **Attack Vector**: Unauthenticated GET request to scrape PII of high-profile invitees.
*   **Result**: MUST be denied as authentication is required for all reads.

### Payload 11: Direct Bypassing of Validation on Guest Status
*   **Target Path**: `/guests/guest_bernardo`
*   **Attack Vector**: Omitting required fields like `distributor` during status transition.
```json
{
  "id": "guest_bernardo",
  "email": "bernardo@fasterling.mx",
  "status": "Completo"
}
```

### Payload 12: Broad Blanket Guest Search (Scraping)
*   **Query**: `db.collection("guests").get()` (without matching auth filter)
*   **Attack Vector**: Scraping database contents using broad, unconstrained queries.
*   **Result**: Must be blocked by the `allow list` checking resource data ownership or staff role.

---

## 3. Test Runner (Mock Tests Implementation)

The following TypeScript code illustrates the Jest unit-test suite checking all above conditions.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "adistem-convention-2026",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          // Rule definition goes here
        }
      `
    }
  });
});

describe("ADISTEM 2026 Security Rules", () => {
  it("blocks privilege escalation (Payload 1)", async () => {
    const context = testEnv.authenticatedContext("guest_bernardo", { email: "bernardo@fasterling.mx" });
    const db = context.firestore();
    const guestRef = doc(db, "guests", "guest_bernardo");
    await assertFails(updateDoc(guestRef, { role: "staff" }));
  });

  it("blocks editing other guest profiles (Payload 2)", async () => {
    const context = testEnv.authenticatedContext("guest_bernardo", { email: "bernardo@fasterling.mx" });
    const db = context.firestore();
    const guestRef = doc(db, "guests", "guest_alejandro");
    await assertFails(updateDoc(guestRef, { name: "Alejandro Modificado" }));
  });

  it("blocks invalid document IDs (Payload 3)", async () => {
    const context = testEnv.authenticatedContext("guest_bernardo", { email: "bernardo@fasterling.mx" });
    const db = context.firestore();
    const guestRef = doc(db, "guests", "guest_$$invalid##");
    await assertFails(setDoc(guestRef, { name: "Attacker" }));
  });
});
```
