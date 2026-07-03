"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationState = exports.BookingStatus = void 0;
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var ConversationState;
(function (ConversationState) {
    ConversationState["IDLE"] = "IDLE";
    ConversationState["AWAITING_SERVICE"] = "AWAITING_SERVICE";
    ConversationState["AWAITING_DATE"] = "AWAITING_DATE";
    ConversationState["AWAITING_TIME"] = "AWAITING_TIME";
    ConversationState["CONFIRMING_BOOKING"] = "CONFIRMING_BOOKING";
})(ConversationState || (exports.ConversationState = ConversationState = {}));
//# sourceMappingURL=index.js.map