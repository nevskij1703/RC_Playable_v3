import Condition from "./Condition";
import Reward from "./Reward";

export default class Trigger {
    static setupForAll(obj, triggers, rewards, conditions) {
        if (!triggers) {
            return;
        }

        (Array.isArray(triggers) ? triggers : [triggers]).forEach((trigger) => {
            Trigger.setup(obj, trigger, rewards, conditions);
        });
    }

    static setup(obj, trigger, rewards, conditions) {
        if (typeof trigger === 'function') {
            trigger.call(obj, {}, () => {
                Trigger.callTrigger(obj, rewards, conditions);
            });

            return;
        }

        let callable = trigger.t;

        delete trigger.t;

        return callable.call(obj, Object.assign({}, trigger), (...args) => {
            Trigger.callTrigger(obj, rewards, conditions, ...args);
        });
    }

    static callTrigger(obj, rewards, conditions, ...args) {
        if (conditions && !Condition.areSatisfied(obj, conditions, ...args)) {
            return;
        }

        Reward.applyAll(obj, rewards, ...args);
    }
}

