package com.jafpsoft.ventas.model.enums;

import com.jafpsoft.ventas.exception.IllegalTicketStateTransitionException;

import java.util.Set;

public enum TicketStatus {

    DRAFT {
        @Override
        public Set<TicketStatus> allowedTransitions() {
            return Set.of(PAYMENT_PENDING, PAID, CANCELLED);
        }
    },
    PAYMENT_PENDING {
        @Override
        public Set<TicketStatus> allowedTransitions() {
            return Set.of(PAYMENT_PROCESSING, PAID, PAYMENT_FAILED, CANCELLED);
        }
    },
    PAYMENT_PROCESSING {
        @Override
        public Set<TicketStatus> allowedTransitions() {
            return Set.of(PAID, PAYMENT_FAILED);
        }
    },
    PAID {
        @Override
        public Set<TicketStatus> allowedTransitions() {
            return Set.of(CANCELLED);
        }
    },
    PAYMENT_FAILED {
        @Override
        public Set<TicketStatus> allowedTransitions() {
            return Set.of(DRAFT, CANCELLED);
        }
    },
    CANCELLED {
        @Override
        public Set<TicketStatus> allowedTransitions() {
            return Set.of();
        }
    };

    public abstract Set<TicketStatus> allowedTransitions();

    public boolean canTransitionTo(TicketStatus next) {
        return allowedTransitions().contains(next);
    }

    public void assertCanTransitionTo(TicketStatus next) {
        if (!canTransitionTo(next)) {
            throw new IllegalTicketStateTransitionException(this.name(), next.name());
        }
    }

    public static TicketStatus fromString(String value) {
        if (value == null) return DRAFT;
        try {
            return TicketStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PAID;
        }
    }
}
