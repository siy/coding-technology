# Java Backend Coding Technology: Rationale

The [Java Backend Coding Technology] is a densely packed reference guide. This article is an attempt to add some general considerations and rationales behind the Technology. 

## First And Foremost
I tried my best to make every decision as rational as possible. 

### Criteria
1. **Mental Overhead** - Each "Don't forget to..." and "Keep in mind that..." is a mental overhead.
2. **Business/Technical Ratio** - The lower level of the technical details in code, the better business is visible. The more elements in code reflect business semantics, the better. 
3. **Design Impact** - Whether an approach improves design consistency or breaks it. Does it enforce good patterns or allow bad ones?
4. **Reliability** - Does the compiler catch mistakes, or must you remember? Type safety that makes invalid states unrepresentable eliminates entire classes of bugs.
5. **Complexity** - Number of elements, connections, and especially hidden coupling. Fewer moving parts and explicit dependencies are better.

## Reducing Complexity
You'll notice it behind basically every decision. Sometimes it means loosing current flexibility by limiting choices. 

## Reducing Mental Overhead
Clarity, precise and explicit domain semantics expression in code. Again, the price for this is complete dilution of the personal style. It also saves tons of time by eliminating internal style debates. 

## Basic Considerations
- The simpler - the better. Minimal implementation, minimal complexity, minimal dependencies. Limited set of middle level design choices removes everyday hurdle to invent the wheel. You have ready to use wheels already. 
- Balance between brevity and context preservation. It's tempting to write concise code and functional style can be very good at it. But this easily can result in write-only code. Many rules intentionally focused on prevention this to happen. 
- Consistent approach. Equal rules used to make decisions. Rationale behind every decision.

Let's look at them closer.

## Why 