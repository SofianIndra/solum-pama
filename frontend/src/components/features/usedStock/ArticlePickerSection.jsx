import SectionCard from "@/components/core/SectionCard";
import ArticleSelect from "@/components/features/solum/ArticleSelect";
import SolumTargetFields from "@/components/features/solum/SolumTargetFields";

// Container 1: which SOLUM company, store and article the stock belongs to (like the Data Artikel tab in solum-alfa).
const ArticlePickerSection = ({ selection, defaults, onChange, onArticleChange }) => {
  return (
    <SectionCard step={1} title="Pilih Artikel" description="Company, store, dan article di SOLUM AIMS.">
      <div className="grid gap-5 sm:grid-cols-2">
        <SolumTargetFields value={selection} defaults={defaults} onChange={onChange} />
        <ArticleSelect
          company={selection.company}
          store={selection.store}
          articleId={selection.articleId}
          articleName={selection.articleName}
          onChange={onArticleChange}
          className="sm:col-span-2"
        />
      </div>
    </SectionCard>
  );
};

export default ArticlePickerSection;
