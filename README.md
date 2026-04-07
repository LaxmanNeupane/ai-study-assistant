## Overview: 
This project is an end-to-end AI-enabled application that processes course PDFs into structured study notes and allows students to ask questions based on those materials.

## Grill-me evidence:
Grill Me I want to build an AI Study Notes Assistant with PDF ingestion, ETL, and Q&A. Challenge this idea.”
6:18 PM



Worked for 1s
First question: who is the primary user, exactly?

Right now “AI Study Notes Assistant” could mean at least three different products:

Students turning class PDFs into study aids.
Professionals extracting knowledge from dense docs.
Researchers building a searchable personal knowledge base.
These lead to very different ingestion quality bars, Q&A expectations, UX, and privacy constraints.

Recommended answer: “The first version is for individual students who upload course PDFs like lecture slides, textbook chapters, and handouts, then ask questions and generate concise study notes and quiz material for a single course.”


6:18 PM
it is for students
6:21 PM



Worked for 1s
Next question: what kind of student, and in what study context?

A high-schooler reviewing worksheets, a college STEM student with slide decks and formulas, and a law student reading long case PDFs need very different extraction and answer behavior. If we don’t pick one, the ETL and Q&A layer will get mushy fast.

Recommended answer: “The first version is for college and university students studying from lecture slides, professor handouts, and textbook PDFs for one course at a time.”


6:21 PM
go with the recommended answer
6:23 PM


Next question: what is the single most important job the product must do well on day one?

Possible answers include:

Answer questions from uploaded PDFs
Generate clean study notes from messy PDFs
Create flashcards/quizzes from course material
Organize course documents into a usable knowledge base
These are not the same product. If you try to ship all four, you’ll build a mediocre pipeline instead of a sharp first version.

Recommended answer: “Day one, the product’s core job is turning course PDFs into trustworthy, structured study notes, with Q&A as a secondary feature grounded only in the uploaded material.”


6:23 PM
yes follow your recommendation
6:24 PM



Worked for 0s
Next question: should the assistant answer only from uploaded course material, or can it supplement with general model knowledge?

This is a make-or-break product choice. If it uses outside knowledge, answers may sound smarter but become less trustworthy for studying a specific course. If it stays source-grounded, the product is narrower but much safer and easier to defend.

Recommended answer: “For the first version, all notes and Q&A must be grounded only in the uploaded PDFs, and the assistant should say when the material does not contain enough information.”


6:24 PM
For the first version, all notes and Q&A must be grounded only in the uploaded PDFs, and the assistant should say when the material does not contain enough information
6:24 PM


Next question: what types of PDFs are in scope for v1?

This matters because “PDF ingestion” can hide a swamp:

Digital text PDFs with selectable text
Slide decks with sparse bullets
Scanned/image PDFs requiring OCR
Mixed PDFs with charts, formulas, tables, and diagrams
If you support all of these on paper, your ETL becomes the whole company.

Recommended answer: “V1 supports digitally generated PDFs with selectable text, including lecture slides, handouts, and textbook chapters; scanned PDFs and heavy diagram/table extraction are out of scope initially.”


6:24 PM
V1 supports digitally generated PDFs with selectable text, including lecture slides, handouts, and textbook chapters; scanned PDFs and heavy diagram/table extraction are out of scope initially
6:25 PM




Worked for 0s
Next question: is the unit of organization a single PDF, a course, or the whole student workspace?

This choice affects ingestion, retrieval, UI, and trust. If all documents share one global index, cross-course contamination becomes likely. If everything is isolated per PDF, the assistant misses useful connections across course materials.

Recommended answer: “The primary unit is a course workspace containing multiple PDFs, and all notes and Q&A are scoped to one selected course at a time.
## Key Challenges Identified
- Target user was unclear
- Scope was too broad
- Data handling approach was undefined

### Final Refined Decisions

#### Target User
Individual college/university students studying a single course.

#### Core Job
Convert course PDFs into clean, structured study notes.  
Q&A is a secondary feature.

#### Knowledge Constraint
Answers must only use uploaded course materials.  
If information is missing, the system explicitly says so.

#### Supported Data
-  Digital PDFs with selectable text  
-  Scanned PDFs  
-  Complex diagrams/tables  

#### Data Organization
- Course-based workspace  
- Multiple PDFs per course  
- No cross-course mixing  

### Changes Made After Grilling
- Reduced scope to student use-case
- Simplified ingestion pipeline
- Focused on reliability over complexity
